const DataComponent = require('../data-component');
const h = require('react-hyperscript');
const io = require('socket.io-client');
const _ = require('lodash');
const EventEmitter = require('eventemitter3');
const uuid = require('uuid');
const Cytoscape = require('cytoscape');
const logger = require('../../logger');
const Document = require('../../../model/document');
const { makeCyEles, getCyLayoutOpts, tryPromise } = require('../../../util');
const Tooltip = require('../popover/tooltip');
const Popover = require('../popover/popover');
const MainMenu = require('../main-menu');
const { TaskView } = require('../tasks');
const Interaction = require('../../../model/element/interaction');
const InteractionForm = require('./interaction-form');

class FormEditor extends DataComponent {
  constructor(props){
    super(props);

    let docSocket = io.connect('/document');
    let eleSocket = io.connect('/element');

    let logSocketErr = (err) => logger.error('An error occurred during client-side socket communication', err);

    docSocket.on('error', logSocketErr);
    eleSocket.on('error', logSocketErr);

    let id = _.get( props, 'id' );
    let secret = _.get( props, 'secret' );


    let doc = new Document({
      socket: docSocket,
      factoryOptions: { socket: eleSocket },
      data: { id, secret }
    });

    let bus = new EventEmitter();

    this.data = {
      document: doc,
      bus: bus,
    };

    let dirty = (() => {
      this.dirty();
    });

    tryPromise( () => doc.load() )
      .then( () => logger.info('The doc already exists and is now loaded') )
      .catch( err => {
        logger.info('The doc does not exist or an error occurred');
        logger.warn( err );

        return ( doc.create()
            .then( () => logger.info('The doc was created') )
            .catch( err => logger.error('The doc could not be created', err) )
        );
      } )
      .then( () => doc.synch(true) )
      .then( () => logger.info('Document synch active') )
      .then( () => {

        doc.elements().forEach( el => {
          el.on('remotecomplete', dirty);
        });

        doc.on('remoteadd', docEl => {
          docEl.on('remotecomplete', dirty);
          dirty();
        });
        doc.on('remoteremove', docEl => {
          docEl.removeListener('remotecomplete', dirty);
          dirty();
        });

        doc.on('submit', dirty);

        dirty();

        logger.info('The editor is initialising');
      } );

  }

  componentWillUnmount(){
    let { document, bus } = this.data;

    document.elements().forEach( el => el.removeAllListeners() );
    document.removeAllListeners();
    bus.removeAllListeners();
  }

  dirty(){
    super.dirty();

    this.data.bus.emit('dirty');
  }

  addInteractionRow({ name, association }){
    let doc = this.data.document;

    let dirty = () => this.dirty();

    let entries = [ uuid(), uuid() ].map( (id) => ({
      id,
      group: Interaction.PARTICIPANT_TYPE.UNSIGNED
    }) );

    let createEnt = (entry) => doc.factory().make({
      data: {
        type: 'entity',
        name: '',
        id: entry.id
      }
    });

    let createEnts = () => Promise.all(entries.map(e => createEnt(e)));

    let createIntn = () => doc.factory().make({
      data:  {
        type: 'interaction',
        name,
        completed: true,
        association: association != null
          ? ( _.isString(association) ? association : association.value ) : 'interaction',
        entries
      }
    });

    let destroyCy = ({ cy }) => {
      if ( cy != null ) {
        cy.destroy();
      }
    };

    let runLayout = cy => {
      let layout = cy.layout( _.assign( {}, getCyLayoutOpts(), {
        animate: false,
        randomize: false
      } ) );

      let layoutDone = layout.promiseOn('layoutstop');

      layout.run();

      return layoutDone;
    };

    let createElsAndRunLayout = () => tryPromise( () =>
      Promise.all([ createIntn(), createEnts() ])
      .then( ([ intn, ppts ]) => {
        let cy = new Cytoscape({
          headless: true,
          elements: makeCyEles( doc.elements() ),
          layout: { name: 'preset' },
          styleEnabled: true
        });

        // already existing elements are supposed to be locked during the layout
        cy.nodes().lock();

        // create cy eles for the new elements that are not represented in cy
        // yet because they were not in document while cy is created
        cy.add( makeCyEles([intn, ...ppts]) ).nodes().forEach(n => n.position({
          x: Math.random() * 10,
          y: Math.random() * 10
        }));

        return runLayout(cy).then( () => ({ cy, intn, ppts }) );
      } )
    );

    let updatePos = (el, cy) => {
      let cyEle = cy.getElementById( el.id() );
      let pos =  _.clone( cyEle.position() );

      return el.reposition( pos );
    };

    let synch = el => el.synch(true);
    let create = el => el.create();
    let add = el => doc.add(el);
    let handleElCreation = el => tryPromise( () => synch(el) ).then( () => create(el) );

    let saveResults = ({ intn, ppts, cy }) => {
      return (
        Promise.all( ppts.map(ppt => updatePos(ppt, cy)) )
        .then( () => Promise.all([intn, ...ppts].map(handleElCreation)) )
        .then( () => ppts.map(add) )
        .then( () => add(intn) )
        .then( () => ({ intn, ppts, cy }) )
      );
    };

    return (
      tryPromise( createElsAndRunLayout )
      .then( saveResults )
      .then( destroyCy )
      .then( dirty )
    );
  }

  deleteInteractionRow(intn){
    let doc = this.data.document;
    let otherIntns = doc.interactions().filter(intn2 => intn2 !== intn);
    let ppts = intn.participants();
    let danglingPpts = ppts.filter(ppt => !otherIntns.some(intn => intn.has(ppt)));

    let rm = el => doc.remove(el);
    let rmIntn = () => rm(intn);
    let rmDanglingPpts = () => Promise.all(danglingPpts.map(rm));
    let rmAll = () => Promise.all([ rmIntn(), rmDanglingPpts() ]);
    let dirty = () => this.dirty();

    return tryPromise(rmAll).then(dirty);
  }

  render(){
    let doc = this.data.document;
    let { bus } = this.data;
    let { history } = this.props;

    let IntnEntry = ({ interaction }) => h('div.form-interaction-entry', [
      h(InteractionForm, {
        key: interaction.id(),
        document: doc,
        interaction: interaction,
        description: "interaction",
        bus: this.data.bus,
      }),
      h('button.delete-interaction.plain-button', {
          onClick: () => {
            this.deleteInteractionRow(interaction);
          }
        }, [
          h('i.material-icons', 'delete')
        ]
      )
    ]);

    let FormTypeButton = () => h(Tooltip, {
        description: "new interaction",
        tippy: {
          placement: 'right'
        }
      }, [
        h('button', {
          className: 'form-interaction-adder',
          onClick: () => {
            let addInteractionRow = () => this.addInteractionRow( {
              name: Interaction.ASSOCIATION.INTERACTION.toString(),
              association: Interaction.ASSOCIATION.INTERACTION
            } );
            addInteractionRow();
          }
        }, "Add interaction")
      ]
    );

    return (
      h('div', [
        h('div.form-main-menu', [
          h(MainMenu, { bus, document: doc, history })
        ]),
        h('div.form-submit', [
          h(Popover, { tippy: { html: h(TaskView, { document: doc, bus } ) } },
            [
            doc.submitted() ? h('button.form-submit-button', 'Submitted')
              : h('button.form-submit-button.salient-button', 'Submit')
          ])
        ]),
        h('div.form-editor', [
          h('div.form-content', [
            h('h3.form-editor-title',
              doc.name() === '' ? 'Untitled document' : doc.name()),
            h('div.form-templates', (
              doc.interactions().filter(intn => intn.completed())
                .map( (interaction) =>  h(IntnEntry, { interaction }))
            )),
            h('div.form-interaction-adder-area', [
              h(FormTypeButton, {
                className: 'form-interaction-adder'
              })
            ])
          ])
        ])
      ])
    );
  }
}

module.exports = FormEditor;
