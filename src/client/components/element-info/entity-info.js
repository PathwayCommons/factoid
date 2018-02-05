const React = require('react');
const h = require('react-hyperscript');
const ReactDom = require('react-dom');
const { focusDomElement, makeClassList } = require('../../../util');
const _ = require('lodash');
const defs = require('../../defs');
const anime = require('animejs');
const queryString = require('query-string');
const Promise = require('bluebird');
const OrganismToggle = require('../organism-toggle');
const Organism = require('../../../model/organism');
const Highlighter = require('../highlighter');
const Notification = require('../notification');
const InlineNotification = require('../notification/inline');
const Tooltip = require('../popover/tooltip');

const { UNIPROT_LINK_BASE_URL, CHEBI_LINK_BASE_URL } = require('../../../config');

const animateDomForEdit = domEle => anime({
  targets: domEle,
  backgroundColor: [defs.editAnimationWhite, defs.editAnimationColor, defs.editAnimationWhite],
  duration: defs.editAnimationDuration,
  easing: defs.editAnimationEasing
});

const STAGES = Object.freeze({
  NAME: 'name',
  ASSOCIATE: 'associate',
  MODIFY: 'mod',
  COMPLETED: 'completed'
});

const ORDERED_STAGES = [ STAGES.NAME, STAGES.ASSOCIATE, STAGES.MODIFY, STAGES.COMPLETED ];

const getStageIndex = stage => ORDERED_STAGES.indexOf( stage );
const getNextStage = stage => ORDERED_STAGES[ getStageIndex(stage) + 1 ];
const getPrevStage = stage => ORDERED_STAGES[ getStageIndex(stage) - 1 ];

class SingleValueCache {
  constructor(){ this.value = null; }
  get(){ return this.value; }
  set(k, v){ this.value = v; }
}

let associationCache = new WeakMap();
let stageCache = new WeakMap();
let nameNotificationCache = new SingleValueCache();
let assocNotificationCache = new SingleValueCache();
let modNotificationCache = new SingleValueCache();

let initCache = ( cache, el, initVal ) => {
  let cacheEntry = cache.get( el );

  if( cacheEntry == null ){
    cacheEntry = initVal;

    cache.set( el, cacheEntry );
  }

  return cacheEntry;
};

class EntityInfo extends React.Component {
  constructor( props ){
    super( props );

    let el = props.element;

    let assoc = initCache( associationCache, el, { matches: [], offset: 0 } );

    let stage = initCache( stageCache, el, el.completed() ? STAGES.COMPLETED : ORDERED_STAGES[0] );

    let nameNotification = initCache( nameNotificationCache, el, new Notification({ active: true }) );

    let assocNotification = initCache( assocNotificationCache, el, new Notification({ active: true }) );

    let modNotification = initCache( modNotificationCache, el, new Notification({ active: true }) );

    this.debouncedRename = _.debounce( name => {
      this.data.element.rename( name );

      this.updateMatches( name );
    }, defs.updateDelay );

    this.debouncedUpdateMatches = _.debounce( name => {
      this.updateMatches( name );
    }, defs.updateDelay );

    this.debouncedFocusNameInput = _.debounce( () => {
      if( this._unmounted ){ return; }

      let root = ReactDom.findDOMNode( this );
      let input = root.querySelector('.entity-info-name-input');

      if( input != null ){
        focusDomElement( input );
      }
    }, 50 );

    this.data = {
      element: el,
      name: el.name(),
      oldName: el.name(),
      modification: el.modification(),
      matches: assoc.matches,
      gettingMoreMatches: false,
      limit: defs.associationSearchLimit,
      offset: assoc.offset,
      stage,
      nameNotification,
      assocNotification,
      modNotification
    };

    this.state = _.assign( {}, this.data );
  }

  setData( name, value, callback ){
    if( _.isObject(name) ){
      callback = value;

      _.assign( this.data, name );
    } else {
      this.data[ name ] = value;
    }

    this.setState( this.data, callback );
  }

  focusNameInput(){
    this.debouncedFocusNameInput();
  }

  componentDidMount(){
    let root = ReactDom.findDOMNode( this );
    let input = root.querySelector('.entity-info-name-input');
    let modSel = root.querySelector('.entity-info-mod-select');
    let p = this.props;
    let s = this.data;
    let doc = p.document;

    if( s.stage === ORDERED_STAGES[0] ){
      this.goToStage( s.stage );
    }

    this.onRemoteRename = () => {
      this.setData({ name: this.data.element.name() });

      if( this.remRenameAni ){
        this.remRenameAni.pause();
      }

      this.remRenameAni = animateDomForEdit( input );
    };

    s.element.on('remoterename', this.onRemoteRename);

    this.onRemoteModify = () => {
      this.setData({ modification: s.element.modification() });

      if( this.remModAni ){
        this.remModAni.pause();
      }

      this.remModAni = animateDomForEdit( modSel );
    };

    s.element.on('remotemodify', this.onRemoteModify);

    this.onToggleOrganism = () => {
      associationCache = new WeakMap(); // all entities invalidated

      this.updateMatches( this.data.name, s.offset, true );
    };

    doc.on('toggleorganism', this.onToggleOrganism);

    if( s.matches.length === 0 && s.name != null && s.name != '' ){
      this.updateMatches();
    }
  }

  componentWillUnmount(){
    let { document, element } = this.props;
    let update = this.data.updatePromise;

    element.removeListener('remoterename', this.onRemoteRename);

    element.removeListener('remotemodify', this.onModifyEle);

    document.removeListener('toggleorganism', this.onToggleOrganism);

    if( update ){ update.cancel(); }

    this._unmounted = true;
  }

  modify( mod ){
    if( _.isString(mod) ){
      mod = this.data.element.MODIFICATION_BY_VALUE(mod);
    }

    this.setData({ modification: mod });

    this.data.element.modify( mod );
  }

  rename( name ){
    let s = this.data;
    let el = s.element;

    el.rename( name );

    this.updateMatches( name );

    this.setData({
      name: name,
      updateDirty: true
    });
  }

  updateCachedName( name ){
    this.setData({ name });

    this.debouncedUpdateMatches( name );
  }

  clear(){
    this.setData({
      name: '',
      matches: []
    });
  }

  associate( match ){
    let s = this.data;
    let el = s.element;

    el.associate( match );

    // this indicates to render the match immediately though the data on the server may not be updated yet
    this.setData({
      match: match
    });
  }

  unassociate(){
    let s = this.data;
    let el = s.element;

    el.unassociate();

    this.setData({
      matches: [],
      match: null
    }, () =>  this.focusNameInput());

    this.updateMatches();
  }

  updateMatches( name = this.data.name, offset = this.data.offset, changedOrganisms = false ){
    let s = this.data;
    let p = this.props;
    let el = s.element;
    let doc = p.document;
    let qOrgs = doc.organisms().map( org => org.id() ).join(',');

    let isNewName = name !== s.oldName;
    let clearOldMatches = isNewName || changedOrganisms;
    let needsUpdate = isNewName || changedOrganisms || offset != this.data.offset || s.matches.length === 0;

    if( !needsUpdate ){ return Promise.resolve(); }

    if( this._unmounted ){ return Promise.resolve(); }

    if( clearOldMatches ){
      offset = 0;

      this.setData({ matches: [] });
    }

    let q = {
      name: name,
      limit: s.limit,
      offset: offset,
      organism: qOrgs
    };

    if( s.updatePromise ){
      s.updatePromise.cancel();
    }

    let update;

    if( name ){
      update = (
        Promise.try( () => fetch( '/api/element-association/search?' + queryString.stringify(q) ) )
        .then( res => res.json() )
        .then( matches => {
          if( this._unmounted ){ return; }

          if( clearOldMatches ){
            s.matches = matches;
          } else {
            matches.forEach( m => s.matches.push(m) );
          }

          // cache the matches in the element for re-creation of component
          associationCache.set( el, {
            matches: s.matches,
            offset: offset
          } );

          this.setData({
            matches: s.matches,
            replacingMatches: false,
            loadingMatches: false,
            updatePromise: null,
            updateDirty: false
          }, () => {
            if( clearOldMatches ){
              let root = ReactDom.findDOMNode(this);
              let matches = root != null ? root.querySelector('.entity-info-matches') : null;

              if( matches != null ){
                matches.scrollTop = 0;
              }
            }
          });
        } )
      );
    } else {
      update = Promise.resolve();

      associationCache.set( el, { matches: [], offset: 0 } );

      this.setData({
        updateDirty: false
      });
    }

    this.setData({
      loadingMatches: name ? true : false,
      oldName: name,
      updatePromise: update,
      offset: offset,
      matches: name ? s.matches : [],
      replacingMatches: clearOldMatches
    });

    return update;
  }

  getMoreMatches( numMore = this.data.limit ){
    let s = this.data;

    if( !s.name || s.gettingMoreMatches || this._unmounted ){ return Promise.resolve(); }

    let offset = s.offset + numMore;

    this.setData({
      gettingMoreMatches: true
    });

    return this.updateMatches( s.name, offset ).then( () => {
      this.setData({
        gettingMoreMatches: false
      });
    } );
  }

  getStage(){
    return this.data.stage;
  }

  back(){
    this.goToStage( getPrevStage( this.getStage() ) );
  }

  forward(){
    this.goToStage( getNextStage( this.getStage() ) );
  }

  canGoToStage( stage ){
    let { element: el, stage: currentStage, name: cachedName } = this.data;

    switch( stage ){
      case STAGES.NAME:
        return true;
      case STAGES.ASSOCIATE:
        return cachedName != null && cachedName != '';
      case STAGES.MODIFY:
        return el.associated();
      case STAGES.COMPLETED:
        return (
          currentStage === STAGES.MODIFY ||
          ( currentStage === STAGES.ASSOCIATE && el.type() === el.TYPES.CHEMICAL )
        );
    }
  }

  canGoBack(){
    return this.canGoToStage( getPrevStage( this.data.stage ) );
  }

  canGoForward(){
    return this.canGoToStage( getNextStage( this.data.stage ) );
  }

  goToStage( stage ){
    let { stage: currentStage, name, element } = this.data;
    let elSupportsMod = element.moddable();

    if(
      currentStage === STAGES.NAME && stage === STAGES.ASSOCIATE
      && name != null && name !== '' && name !== element.name()
    ){
      this.rename( name );
    }

    if(
      currentStage === STAGES.ASSOCIATE && stage === STAGES.MODIFY
      && !elSupportsMod
    ){
      stage = STAGES.COMPLETED;
    }

    if(
      currentStage === STAGES.COMPLETED && stage === STAGES.MODIFY
      && !elSupportsMod
    ){
      stage = STAGES.ASSOCIATE;
    }

    if( this.canGoToStage(stage) ){
      this.setData({ stage, stageError: null });

      stageCache.set( this.data.element, stage );

      switch( stage ){
        case STAGES.NAME:
          if( this.data.name ){
            this.data.nameNotification.message(`This entity is incomplete.  Amend the name of "${this.data.name}", if necessary, and then go to the next step.`);
          } else {
            this.data.nameNotification.message(`This entity is incomplete.  Name the entity, then go to the next step.`);
          }


          this.focusNameInput();
          break;

        case STAGES.ASSOCIATE:
          this.data.assocNotification.message(`Link "${this.data.name}" to one of the following identifiers.  Linking increases the impact of your paper by enabling data sharing and computational analysis.`);
          break;

        case STAGES.MODIFY:
          this.data.modNotification.message(`Specifying a modification can help to more accurately represent the state of ${this.data.name}.`);
          break;

        case STAGES.COMPLETED:
          this.complete();
          break;
      }
    } else {
      let stageError;

      switch( currentStage ){
        case STAGES.ASSOCIATE:
          stageError = `Link "${this.data.name}" with an identifier before proceeding.`;
          break;
        default:
          stageError = 'This step should be completed before proceeding.';
      }

      this.setData({ stageError });
    }
  }

  complete(){
    let { element: el } = this.data;

    return el.complete();
  }

  render(){
    let s = this.state;
    let p = this.props;
    let doc = p.document;
    let children = [];

    let Loader = ({ loading = true }) => h('div.entity-info-matches-loading' + (loading ? '.entity-info-matches-loading-active' : ''), [
      loading ? h('i.icon.icon-spinner') : h('i.material-icons', 'remove')
    ]);

    let onMatchesScroll = _.debounce( div => {
      let scrollMax = div.scrollHeight;
      let scroll = div.scrollTop + div.clientHeight;

      if( scroll >= scrollMax ){
        this.getMoreMatches();
      }
    }, defs.updateDelay / 2 );

    let stage = this.getStage();

    let assoc;

    if( s.match != null ){
      assoc = s.match;
    } else if( s.element.associated() ){
      assoc = s.element.association();
    } else {
      assoc = null;
    }

    let proteinFromAssoc = (m, searchTerm) => {
      return [
        h('div.entity-info-section', [
          h('span.entity-info-title', 'Organism'),
          h('span', Organism.fromId(m.organism).name())
        ]),
        h('div.entity-info-section', !m.proteinNames ? [] : [
          h('span.entity-info-title', 'Protein names'),
          ...m.proteinNames.map( name => h('span.entity-info-alt-name', [
            h(Highlighter, { text: name, term: searchTerm })
          ]))
        ]),
        h('div.entity-info-section', !m.geneNames ? [] : [
          h('span.entity-info-title', 'Gene names'),
          ...m.geneNames.map( name => h('span.entity-info-alt-name', [
            h(Highlighter, { text: name, term: searchTerm })
          ]))
        ])
      ];
    };

    let Formula = ({ formula }) => {
      let split = formula.match(/(\d+|[n]|[A-Z][a-z]?)/g);
      let children = [];

      split.forEach( str => {
        if( str === 'n' || isNaN( parseInt(str) ) ){
          children.push( h('span', str) );
        } else {
          children.push( h('sub', str) );
        }
      } );

      return h('span.entity-info-formula', children);
    };

    let chemFromAssoc = (m, searchTerm) => {
      return [
        h('div.entity-info-section', [
          h('span.entity-info-title', 'Formulae'),
          ...m.formulae.map( formula => h(Formula, { formula }) )
        ]),
        h('div.entity-info-section', [
          h('span.entity-info-title', 'Mass'),
          h('span', m.mass)
        ]),
        h('div.entity-info-section', [
          h('span.entity-info-title', 'Charge'),
          h('span', m.charge)
        ]),
        h('div.entity-info-section', !m.synonyms ? [] : [
          h('span.entity-info-title', 'Synonyms'),
          ...m.synonyms.map( name => h('span.entity-info-alt-name', [
            h(Highlighter, { text: name, term: searchTerm })
          ]))
        ])
      ];
    };

    let targetFromAssoc = (m, highlight = true, showEditIcon = false) => {
      let searchTerm = highlight ? s.name : null;

      let pre = [
        h('div.entity-info-name', [
          h(Highlighter, { text: m.name, term: searchTerm }),
          showEditIcon && doc.editable() ? (
            h(Tooltip, { description: 'Edit from the beginning' }, [
              h('button.entity-info-edit.plain-button', {
                onClick: () => this.goToStage( ORDERED_STAGES[0] )
              }, [ h('i.material-icons', 'edit') ])
            ])
          ) : null
        ].filter( domEl => domEl != null ))
      ];

      let body;

      switch( m.type ){
        case 'protein':
          body = proteinFromAssoc( m, searchTerm );
          break;
        case 'chemical':
          body = chemFromAssoc( m, searchTerm );
          break;
      }

      let post = [];

      return _.concat( pre, body, post );
    };

    let modForList = () => {
      return h('div.entity-info-section', [
        h('span.entity-info-title', 'Modification'),
        h('span', s.modification.displayValue)
      ]);
    };

    let linkFromAssoc = m => {
      let url;

      switch( m.type ){
        case 'protein':
          url = UNIPROT_LINK_BASE_URL + m.id;
          break;
        case 'chemical':
          url = CHEBI_LINK_BASE_URL + m.id;
          break;
      }

      return h('div.entity-info-section', [
        h('a.plain-link', { href: url, target: '_blank' }, [
          'More information ',
          h('i.material-icons', 'open_in_new')
        ])
      ]);
    };

    let allAssoc = m => _.concat(
      targetFromAssoc(m, false, true),
      s.element.moddable() ? modForList() : [],
      linkFromAssoc(m)
    );

    if( !doc.editable() || stage === STAGES.COMPLETED ){
      if( assoc == null ){
        children.push( h('div.entity-info-no-assoc', [
          h('div.element-info-message.element-info-no-data', [
            h('i.material-icons', 'info'),
            h('span', ' This entity has no data associated with it.')
          ])
        ]) );
      } else {
        children.push( h('div.entity-info-assoc', allAssoc( assoc )) );
      }
    } else if( stage === STAGES.NAME ){
      let NameNotification = () => {
        let notification = s.nameNotification;

        return h(InlineNotification, { notification, className: 'entity-info-notification' });
      };

      children.push( h(NameNotification) );

      children.push(
        h('div.entity-info-name-input-area', [
          h('input.input-round.input-joined.entity-info-name-input', {
            type: 'text',
            placeholder: 'Entity name',
            defaultValue: s.name,
            spellCheck: false,
            onChange: evt => this.updateCachedName( evt.target.value ),
            onKeyDown: evt => {
              switch( evt.keyCode ){
                case 27: // ESC
                  evt.target.blur();
                  break;
                case 13: // ENTER
                  this.forward();
                  break;
              }
            }
          }),

          h('button', {
            className: makeClassList({
              'entity-info-name-clear': true,
              'entity-info-name-clear-disabled': !s.name
            }),
            onClick: () => {
              this.clear();
              this.focusNameInput();
            }
          }, [
            h('i.material-icons', 'close')
          ])
        ])
      );

      children.push( h('div.entity-info-organism-toggles', Organism.ALL.map( organism => {
        let onToggle = () => doc.toggleOrganism( organism );
        let getState = () => doc.organisms().find( o => o.id() === organism.id() ) != null;

        return h(OrganismToggle, { organism, onToggle, getState });
      } )) );
    } else if( stage === STAGES.ASSOCIATE ){
      let AssocMsg = () => {
        let notification = s.assocNotification;

        return h(InlineNotification, { notification, className: 'entity-info-notification' });
      };

      if( s.matches.length > 0 ){
        children.push( h('div.entity-info-matches', {
          className: s.replacingMatches ? 'entity-info-matches-replacing' : '',
          onScroll: evt => {
            onMatchesScroll( evt.target );

            evt.stopPropagation();
          }
        }, [
          h(AssocMsg),

          ...s.matches.map( m => {
            return h('div.entity-info-match', [
              h('div.entity-info-match-target', {
                onClick: () => {
                  this.associate( m );
                  this.forward();
                }
              }, targetFromAssoc( m )),
              linkFromAssoc( m )
            ]);
          }),

          h(Loader, { loading: s.gettingMoreMatches })
        ] ) );
      } else if( !s.loadingMatches && s.name && !s.updateDirty ){
        children.push( h(AssocMsg) );

        children.push( h('div.entity-info-match-empty', [
        ` No identifiers could be found.  Try going back and renaming "${s.name}" to a clearer name.`
        ] ) );
      } else {
        children.push(
          h(AssocMsg),
          h(Loader)
        );
      }
    } else if( stage === STAGES.MODIFY ){
      let notification = s.modNotification;

      children.push( h(InlineNotification, { notification, className: 'entity-info-notification' }) );

      children.push( h('label.entity-info-mod-label', 'Modification') );

      let modChildren = [];

      let onChange = (evt) => {
        this.modify( evt.target.value );
        this.forward();
      };

      s.element.ORDERED_MODIFICATIONS.forEach( mod => {
        let value = mod.value;
        let name = 'mod-radio-' + s.element.id();
        let id = name + '-' + value;
        let type = 'radio';

        modChildren.push(
          h('input', { type, name, id, value, onChange, checked: value === s.modification.value }),
          h('label', { htmlFor: id }, mod.displayValue)
        );
      } );

      children.push( h('div.radioset.entity-info-mod-radioset', modChildren ) );
    }

    if( doc.editable() ){
      children.push( h('div.entity-info-progression', [
        h('button.entity-info-back.plain-button', {
          disabled: !this.canGoBack(),
          onClick: () => this.back()
        }, [ h('i.material-icons', 'arrow_back') ]),

        h('button.entity-info-forward.plain-button', {
          disabled: !this.canGoForward(),
          onClick: () => this.forward()
        }, [ h('i.material-icons', 'arrow_forward') ])
      ]) );
    }

    return h('div.entity-info', children);
  }
}

module.exports = EntityInfo;
