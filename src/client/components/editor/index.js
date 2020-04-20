import DataComponent from '../data-component';
import ReactDom from 'react-dom';
import h from 'react-hyperscript';
import EventEmitter from 'eventemitter3';
import io from 'socket.io-client';
import _ from 'lodash';
import Mousetrap from 'mousetrap';

import { DEMO_ID, DEMO_SECRET, DEMO_AUTHOR_EMAIL, EMAIL_CONTEXT_SIGNUP, DOI_LINK_BASE_URL } from '../../../config';

import { getId, defer, makeClassList, tryPromise } from '../../../util';
import Document from '../../../model/document';
import { PARTICIPANT_TYPE } from '../../../model/element/participant-type';

import Popover from '../popover/popover';

import logger from '../../logger';
import debug from '../../debug';

import makeCytoscape from './cy';
import * as defs from './defs';
import EditorButtons from './buttons';
import MainMenu from '../main-menu';
import UndoRemove from './undo-remove';
import { TaskView } from '../tasks';

const RM_DEBOUNCE_TIME = 500;
const RM_AVAIL_DURATION = 5000;

const keyEmitter = new EventEmitter();

Mousetrap.bind('escape', () => {
  keyEmitter.emit('escape');
});

class Editor extends DataComponent {
  constructor( props ){
    super( props );

    let docSocket = io.connect('/document');
    let eleSocket = io.connect('/element');

    let logSocketErr = (err) => logger.error('An error occurred during clientside socket communication', err);

    docSocket.on('error', logSocketErr);
    eleSocket.on('error', logSocketErr);

    let id = _.get( props, 'id' );
    let secret = _.get( props, 'secret' );

    let doc = new Document({
      socket: docSocket,
      factoryOptions: { socket: eleSocket },
      data: { id, secret }
    });

    if( debug.enabled() ){
      window.doc = doc;
      window.editor = this;
    }

    let checkToClearRmList = () => {
      let now = Date.now();
      let l = this.data.rmList;

      if( now - l.lastTime > RM_DEBOUNCE_TIME ){
        l.els = [];
        l.ppts = [];
        l.oldIdToEl = new Map();
      }

      l.lastTime = now;
    };

    this.rmAvailTimeout = null;

    let makeRmAvailable = () => {
      clearTimeout( this.rmAvailTimeout );

      this.rmAvailTimeout = setTimeout( () => {
        this.setData({ undoRemoveAvailable: false });
      }, RM_AVAIL_DURATION );

      this.setData({ undoRemoveAvailable: true });
    };

    let addRmPptToList = (el, ppt, type) => {
      checkToClearRmList();
      makeRmAvailable();

      this.data.rmList.ppts.push({ el, ppt, type });
    };

    let addRmToList = el => {
      checkToClearRmList();
      makeRmAvailable();

      this.data.rmList.els.push( el );
    };

    let listenForRmPpt = el => el.on('remove', (ppt, type) => addRmPptToList(el, ppt, type));

    doc.on('remove', el => {
      addRmToList( el );

      el.removeAllListeners(); // just to make sure that we don't have dangling listeners causing issues
    });

    const updateLastEditDate = _.debounce(() => {
      doc.updateLastEditedDate();
    }, 1000);

    doc.on('add', el => {
      if( el.isInteraction() || el.isComplex() ){
        listenForRmPpt( el );
      }

      el.on('localupdate', updateLastEditDate);
    });

    doc.on('localadd', updateLastEditDate);
    doc.on('localremove', updateLastEditDate);

    doc.on('update', change => {
      if( _.has( change, 'status' ) ) this.dirty();
    });

    doc.on('load', () => {
      doc.interactions().concat( doc.complexes() ).forEach( listenForRmPpt );

      let docs = JSON.parse(localStorage.getItem('documents')) || [];
      let docData = { id: doc.id(), secret: doc.secret(), name: doc.citation().title };

      if( _.find(docs,  docData) == null ){
        docs.push(docData);
        localStorage.setItem('documents', JSON.stringify(docs));
      }
    });

    let bus = new EventEmitter();

    bus.on('drawtoggle', (toggle, type) => this.toggleDrawMode(toggle, type));
    bus.on('addelement', data => this.addElement( data ));
    bus.on('remove', docEl => this.remove( docEl ));
    bus.on('togglehelp', () => this.toggleHelp());

    let showHelp = false;//JSON.parse(localStorage.getItem('showHelp'));

    if( showHelp == null ){
      showHelp = true;
    }

    // help is always shown for now
    showHelp = true;

    this.hideHelp = () => {
      if( this.data.showHelp ){
        this.toggleHelp();
      }
    };

    localStorage.setItem('showHelp', showHelp);

    this.data = ({
      bus: bus,
      document: doc,
      drawMode: false,
      newElementShift: 0,
      mountDeferred: defer(),
      initted: false,
      showHelp,
      rmList: {
        els: [],
        ppts: [],
        oldIdToEl: new Map(),
        lastTime: 0
      }
    });

    logger.info('Checking if doc with id %s already exists', doc.id());

    tryPromise( () => doc.load() )
      .then( () => logger.info('The doc already exists and is now loaded') )
      .catch( err => {
        if( id === DEMO_ID && secret === DEMO_SECRET ){
          logger.info(`Creating demo document with ID ${id}`);

          let createDemoDoc = () => fetch('/api/document', {
            method: 'POST',
            headers: {
              'content-type': 'application/json'
            },
            body: JSON.stringify({
              paperId: DEMO_ID,
              authorEmail: DEMO_AUTHOR_EMAIL,
              context: EMAIL_CONTEXT_SIGNUP
            })
          });
          let reloadDoc = () => doc.load();

          return createDemoDoc().then(reloadDoc);
        } else {
          logger.error('The doc does not exist or an error occurred');
          logger.error( err );

          throw err;
        }
      } )
      .then( () => doc.synch(true) )
      .then( () => logger.info('Document synch active') )
      .then( () => {
        this.setData({ initted: true, showHelp: this.data.document.editable() });

        const title = _.get(this.data.document.citation(), ['title']);

        if( title ){
          document.title = `${title} : Biofactoid`;
        } else {
          document.title = `Biofactoid`;
        }

        logger.info('The editor is initialising');
      } )
      .then( () => this.data.mountDeferred.promise )
      .then( () => {
        let graphCtr = ReactDom.findDOMNode(this).querySelector('#editor-graph');

        this.data.cy = makeCytoscape({
          container: graphCtr,
          document: this.data.document,
          bus: this.data.bus,
          controller: this
        });

        logger.info('Initialised Cytoscape on mounted editor');
      } )
      .then( () => {
        logger.info('The editor has initialised');
      } )
      .catch( (err) => logger.error('An error occurred livening the doc', err) )
    ;
  }

  done(){
    return this.data.document.submitted() || this.data.document.published();
  }

  editable(){
    return this.data.document.editable();
  }

  toggleDrawMode( toggle, type = PARTICIPANT_TYPE.UNSIGNED ){
    if( !this.editable() ){ return; }

    let alreadyInDrawMode = this.data.drawModeType != null;
    let on;

    if( toggle == null ){
      if( !alreadyInDrawMode || type.value !== this.data.drawModeType.value ){
        on = true; // keep on if just changing type
      } else {
        on = !this.drawMode(); // otherwise flip
      }
    } else {
      on = !!toggle; // ensure bool
    }

    if( on ){
      if( alreadyInDrawMode ){
        // allow extension to go through the full enable-disable cycle for things like locking
        this.data.bus.emit('drawoff');
      }

      this.data.bus.emit('drawon', type );
    } else {
      this.data.bus.emit('drawoff');
    }

    return new Promise( resolve => this.setData({ drawMode: on, drawModeType: type }, resolve) );
  }

  drawMode(){
    return this.data.drawMode;
  }

  drawModeType(){
    return this.data.drawModeType;
  }

  addElement( data = {}, isRestore = false ){
    if( !this.editable() ){ return; }

    let getDefaultPos = () => {
      if ( !_.isNil( this.data.position ) ) {
        return null;
      }

      let cy = this.data.cy;
      let pan = cy.pan();
      let zoom = cy.zoom();
      let getPosition = rpos => ({
        x: ( rpos.x - pan.x ) / zoom,
        y: ( rpos.y - pan.y ) / zoom
      });

      let shift = ( pos, delta ) => ({ x: pos.x + delta.x, y: pos.y + delta.y });
      let shiftSize = defs.newElementShift;
      let shiftI = this.data.newElementShift;
      let delta = { x: 0, y: shiftSize * shiftI };
      let pos = getPosition( shift( _.clone( defs.newElementPosition ), delta ) );

      this.setData({ newElementShift: (shiftI + 1) % defs.newElementMaxShifts });

      return pos;
    };

    let pos = getDefaultPos();
    let doc = this.data.document;

    let el = doc.factory().make({
      data: _.assign( {
        type: 'entity',
        name: '',
        position: pos
      }, data )
    });

    if ( !isRestore ) {
      this.lastAddedElement = el;
    }

    let synch = () => el.synch();
    let create = () => el.create();
    let add = () => doc.add( el );

    return tryPromise( synch ).then( create ).then( add ).then( () => el );
  }

  getLastAddedElement(){
    return this.lastAddedElement;
  }

  addInteraction( data = {} ){
    if( !this.editable() ){ return; }

    return this.addElement( _.assign({
      type: 'interaction',
      name: ''
    }, data) );
  }

  addComplex( data = {} ){
    if( !this.editable() ){ return; }

    return this.addElement( _.assign({
      type: 'complex',
      name: ''
    }, data) );
  }

  remove( docElOrId ){
    if( !this.editable() ){ return; }

    let doc = this.data.document;
    let docEl = doc.get( getId( docElOrId ) ); // in case id passed
    let rmPpt = intn => intn.has( docEl ) ? intn.remove( docEl ) : Promise.resolve();
    let allIntnsRmPpt = () => Promise.all( doc.interactions().map( rmPpt ) );
    let rmEl = () => doc.remove( docEl );

    tryPromise( allIntnsRmPpt ).then( rmEl );
  }

  undoRemove(){
    let { rmList, cy } = this.data;

    if( rmList.els.length === 0 && rmList.ppts.length === 0 ){ return Promise.resolve(); }

    this.setData({
      rmList: { els: [], ppts: [], lastTime: 0 }
    });

    let makeRmUnavil = () => this.setData({ undoRemoveAvailable: false });

    let restorePpt = ({ el, ppt }) => {
      if ( el.isComplex() ) {
        let getUpdatedEl = oldEl => {
          let oldId = oldEl.id();
          if ( rmList.oldIdToEl.has( oldId ) ) {
            return rmList.oldIdToEl.get( oldId );
          }

          return oldEl;
        };

        let updatedPpt = getUpdatedEl( ppt );
        let newParent = getUpdatedEl( el );
        let oldParent = null;
        let doNotAdd = true;

        return updatedPpt.updateParent(newParent, oldParent, doNotAdd);
      }

      return Promise.resolve();
    };

    let restorePpts = () => Promise.all( rmList.ppts.map( restorePpt ) );

    let restoreEl = el => {
      let oldId = el.id();
      let elJson = _.omit( el.json(), [ 'id', 'secret' ] );

      if ( el.isInteraction() || el.isComplex() ) {
        let relatedPpts = rmList.ppts.filter( ( { el: pptEl } ) => pptEl.id() == el.id() );
        let newEntities = relatedPpts.map( ( { ppt, type } ) => {
          let oldId = ppt.id();
          let id = rmList.oldIdToEl.has( oldId ) ? rmList.oldIdToEl.get( oldId ).id() : oldId;

          return { id, group: type };
        } );

        elJson.entries = elJson.entries.concat( newEntities );
      }

      let isRestore = true;
      return this.addElement( elJson, isRestore )
        .then( newEl => rmList.oldIdToEl.set( oldId, newEl ) );
    };

    let restoreEls = els => Promise.all( els.map( restoreEl ) );

    let rmSimpleEntities = rmList.els.filter( el => el.isEntity() && !el.isComplex() );
    let rmOther = rmList.els.filter( el => el.isInteraction() || el.isComplex() );

    let restoreSimpleEntities = () => restoreEls( rmSimpleEntities );
    let restoreOther = () => restoreEls( rmOther );

    let startBatch = () => cy.startBatch();
    let endBatch = () => cy.endBatch();

    return tryPromise( startBatch )
      .then( restoreSimpleEntities )
      .then( restoreOther )
      .then( restorePpts )
      .then( makeRmUnavil )
      .then( endBatch );
  }

  layout(){
    if( !this.editable() ){ return; }

    this.data.bus.emit('layout');
  }

  fit(){
    this.data.bus.emit('fit');
  }

  removeSelected(){
    if( !this.editable() ){ return; }

    this.data.bus.emit('removeselected');
  }

  openFirstIncompleteEntity(){
    if (!this.editable()) { return; }

    let { document, bus } = this.data;

    let incEnts = document.entities().filter(ent => !ent.completed());

    if( incEnts.length > 0 ){
      bus.emit('opentip', incEnts[0]);
    }
  }

  resetMenuState(){
    this.data.bus.emit('closetip');
    this.data.bus.emit('hidetips');
    return Promise.all([this.toggleDrawMode(false)]).delay(250);
  }

  toggleHelp(bool){
    if( bool == null ){
      bool = !this.data.showHelp;
    }

    this.setData({ showHelp: bool });
  }

  render(){
    let { document, bus, showHelp } = this.data;
    let controller = this;
    let { history } = this.props;

    const { authors: { abbreviation }, title = 'Unnamed document', reference, doi } = document.citation();

    let editorContent = this.data.initted ? [
      h('div.editor-title', [
        h('div.editor-title-content', [
          h(doi ? 'a' : 'div', (doi ? { target: '_blank', href: `${DOI_LINK_BASE_URL}${doi}` } : {}), [
            h('div.editor-title-name' + (doi ? '.plain-link.link-like' : ''), title ),
            h('div.editor-title-info', [
              h('div', abbreviation ),
              h('div', reference )
            ])
          ])
        ])
      ]),
      h('div.editor-main-menu', [
        h(MainMenu, { bus, document, history })
      ]),
      this.editable() ? h('div.editor-submit', [
        h(Popover, { tippy: { html: h(TaskView, { document, bus } ) } }, [
          h('button.editor-submit-button', {
            disabled: document.trashed(),
            className: makeClassList({
              'super-salient-button': true,
              'submitted': this.done()
            })
          }, this.done() ?  'Submitted' : 'Submit')
        ])
      ]) : null,
      h(EditorButtons, { className: 'editor-buttons', controller, document, bus, history }),
      h(UndoRemove, { controller, document, bus }),
      h('div.editor-graph#editor-graph'),
      h('div.editor-help-background', {
        className: makeClassList({
          'editor-help-background-shown': false
        }),
        onClick: () => this.toggleHelp()
      }),
      h('div.editor-help', {
        className: makeClassList({
          'editor-help-shown': showHelp
        })
      }, [
        // h('div.editor-help-box', [
        //   h('div.editor-help-close-icon', {
        //     onClick: () => this.toggleHelp()
        //   }, [
        //     h('i.material-icons', 'close')
        //   ]),
        //   h('div.editor-help-title', 'Welcome'),
        //   h('div.editor-scroll-box', [
        //     h('div.editor-help-copy', `
        //       In just a few simple steps you'll compose a pathway containing the key biological interactions described in your article.
        //     `),
        //     h('div.editor-help-cells', [
        //       h('div.editor-help-cell', [
        //         h('img.editor-help-img', { src: '/image/welcome-aboard-1.svg' }),
        //         h('div.editor-help-caption', `1. Add your genes and chemicals`)
        //       ]),
        //       h('div.editor-help-cell', [
        //         h('img.editor-help-img', { src: '/image/welcome-aboard-2.svg' }),
        //         h('div.editor-help-caption', `2. Connect those that interact`)
        //       ]),
        //       h('div.editor-help-cell', [
        //         h('img.editor-help-img', { src: '/image/welcome-aboard-3.svg' }),
        //         h('div.editor-help-caption', `3. For complexes, drag items together`)
        //       ]),
        //       h('div.editor-help-cell', [
        //         h('img.editor-help-img', { src: '/image/welcome-aboard-4.svg' }),
        //         h('div.editor-help-caption', `4. Submit to finish`)
        //       ])
        //     ])
        //   ]),
        //   h('div.editor-help-close', [
        //     h('button.editor-help-close-button.active-button', {
        //       onClick: () => this.toggleHelp()
        //     }, `OK, let's start`)
        //   ])
        // ])
      ])
    ] : [];

    return h('div.editor', {
      className: makeClassList({
        'editor-initted': this.data.initted
      })
    }, editorContent);
  }

  componentDidMount(){
    this.data.mountDeferred.resolve();

    keyEmitter.on('escape', this.hideHelp);
  }

  componentWillUnmount(){
    let { cy, document, bus } = this.data;

    bus.emit('destroytip');

    if( cy ){
      cy.destroy();
    }

    document.elements().forEach( el => el.removeAllListeners() );
    document.removeAllListeners();
    bus.removeAllListeners();
    clearTimeout( this.rmAvailTimeout );

    keyEmitter.removeListener('escape', this.hideHelp);
  }
}

export default Editor;
