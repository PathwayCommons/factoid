const DataComponent = require('../data-component');
const h = require('react-hyperscript');
const io = require('socket.io-client');
const _ = require('lodash');
const EventEmitter = require('eventemitter3');
const Promise = require('bluebird');
const uuid = require('uuid');

const logger = require('../../logger');
const debug = require('../../debug');

const Document = require('../../../model/document');
const { exportDocumentToOwl } = require('../../util');

const AppNav = require('../app-nav');
const Tooltip = require('../popover/tooltip');
const Popover = require('../popover/popover');
const Linkout = require('../document-linkout');


const ProteinModificationForm = require('./protein-modification-form');
const ExpressionRegulationForm = require('./expression-regulation-form');
const MolecularInteractionForm = require('./molecular-interaction-form');
const ActivationInhibitionForm = require('./activation-inhibition-form');

let Interaction = require('../../../model/element/interaction');

class FormEditor extends DataComponent {
  constructor(props){
    super(props);

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

    let bus = new EventEmitter();

    this.data = {
      document: doc,
      bus: bus,
      showIntnAdder: false,
    };

    let dirty = (() => {
      this.dirty();
    });

    Promise.try( () => doc.load() )
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

        if( debug.enabled() ){
          window.doc = doc;
          window.editor = this;
        }

        doc.on('remoteadd', dirty);
        doc.on('remoteremove', dirty);

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

  addInteractionRow({ name, pptTypes, association }){
    let doc = this.data.document;

    let entries = [ uuid(), uuid() ].map( (id, i) => ({
      id,
      group: pptTypes[i].value
    }) );

    let createEnt = (pptType, i) => doc.factory().make({
      data: {
        type: 'entity',
        name: '',
        id: entries[i].id
      }
    });

    let createEnts = () => Promise.all( pptTypes.map( createEnt ) );

    let createIntn = () => doc.factory().make({
      data:  {
        type: 'interaction',
        name,
        completed: true,
        association: association != null ? ( _.isString(association) ? association : association.value ) : 'interaction',
        entries
      }
    });

    return (
      Promise.all([ createIntn(), createEnts() ])
      .then( ([ intn, ppts ]) => {
        let synch = el => el.synch(true);
        let create = el => el.create();
        let add = el => doc.add(el);
        let handleElCreation = el => Promise.try( () => synch(el) ).then( () => create(el) );
        let els = [ intn, ...ppts ];

        return Promise.all( els.map(handleElCreation) ).then( () => {
          return Promise.all( ppts.map(add) ).then( () => add(intn) );
        } );
      } )
      .then( () => this.dirty() )
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

    return Promise.try(rmAll).then(dirty);
  }

  render(){
    let doc = this.data.document;
    let { history } = this.props;

    const formTypes = [
      { type: 'Protein modification', clazz: ProteinModificationForm, pptTypes:[Interaction.PARTICIPANT_TYPE.UNSIGNED, Interaction.PARTICIPANT_TYPE.POSITIVE],  description:"E.g., A phosphorylates B.", association: [Interaction.ASSOCIATION.PHOSPHORYLATION, Interaction.ASSOCIATION.UBIQUINATION, Interaction.ASSOCIATION.METHYLATION] },
      { type: 'Binding', clazz: MolecularInteractionForm, pptTypes: [Interaction.PARTICIPANT_TYPE.UNSIGNED, Interaction.PARTICIPANT_TYPE.UNSIGNED], description: "E.g., A interacts with B.", association: [Interaction.ASSOCIATION.INTERACTION] },
      { type: 'Activation or inhibition', clazz:ActivationInhibitionForm, pptTypes: [Interaction.PARTICIPANT_TYPE.UNSIGNED, Interaction.PARTICIPANT_TYPE.POSITIVE], description: "E.g., A activates B.", association: [Interaction.ASSOCIATION.MODIFICATION] },
      { type: 'Gene expression regulation', clazz: ExpressionRegulationForm, pptTypes: [Interaction.PARTICIPANT_TYPE.UNSIGNED, Interaction.PARTICIPANT_TYPE.POSITIVE], description: "E.g., A promotes the expression of B.", association: [Interaction.ASSOCIATION.EXPRESSION] }
    ];

    let getFormType = intn => {
      let intnAssoc = intn.association();
      let assocMatches = assoc => assoc.value === intnAssoc.value;

      return formTypes.find( ft => ft.association.some(assocMatches) );
    };

    let IntnEntry = ({ interaction, formType }) => h('div.form-interaction-entry', [
      h(formType.clazz, {
        key: interaction.id(),
        document: doc,
        interaction: interaction,
        description: formType.type,
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

    let FormTypeButton = ({ formType }) => h(Tooltip, {
        description: formType.description,
        tippy: {
          placement: 'right'
        }
      }, [
        h('button.plain-button', {
          onClick: () => {
            let doc = this.data.document;

            let addInteractionRow = () => this.addInteractionRow( {
              name: formType.type,
              pptTypes: formType.pptTypes,
              association: formType.association[0]
            } );

            let applyLayout = () => doc.applyLayout();

            Promise.try( addInteractionRow ).then( applyLayout );
          }
        }, formType.type)
      ]
    );

    return (
      h('div.form-editor', [
        h('div.form-content', [
          h('h3.form-editor-title', doc.name() === '' ? 'Untitled document' : doc.name()),
          h('div.form-templates', (
            doc.interactions()
            .filter(intn => intn.completed())
            .map(interaction => ({ interaction, formType: getFormType(interaction) }))
            .filter(({ formType }) => formType != null)
            .map( ({ interaction, formType }) => h(IntnEntry, { interaction, formType }) )
          )),
          h('div.form-interaction-adder-area', [
            h(Popover, {
              tippy: {
                position: 'bottom',
                html: h('div.form-interaction-adder-options', formTypes.map( formType => h(FormTypeButton, { formType }) ))
              }
            }, [
              h('button', {
                className: 'form-interaction-adder',
                onToggle: () => this.toggleIntnAdderVisibility(),
                getState: () => this.data.showIntnAdder
              }, [
                h('i.material-icons.add-new-interaction-icon', 'add'),
                'Add interaction'
              ])
            ])
          ])
        ]),
        h('div.form-app-bar', [
          h('div.form-app-buttons', [
            h(Tooltip, { description: 'Home' }, [
              h('button.editor-button.plain-button', { onClick: () => history.push('/') }, [
                h('i.app-icon')
              ])
            ]),
            h(Tooltip, { description: 'Save as BioPAX' }, [
              h('button.editor-button.plain-button', { onClick: () => exportDocumentToOwl( doc.id() ) }, [
                h('i.material-icons', 'save_alt')
              ])
            ]),
            h(Popover, {
              tippy: {
                position: 'right',
                html: h('div.editor-linkout', [
                  h(Linkout, { document: doc })
                ])
              }
            }, [
              h('button.editor-button.plain-button', [
                h('i.material-icons', 'link')
              ])
            ]),
            h(Popover, {
              tippy: {
                position: 'right',
                followCursor: false,
                html: h(AppNav, { document: doc, history, networkEditor: false })
              }
              }, [
              h('button.editor-button.plain-button', [
                h('i.material-icons', 'more_vert')
              ])
            ])
          ])
        ])
      ])
    );
  }
}

module.exports = FormEditor;
