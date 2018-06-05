const DirtyComponent = require('../dirty-component');
const h = require('react-hyperscript');
const io = require('socket.io-client');
const _ = require('lodash');
const EventEmitter = require('eventemitter3');

const logger = require('../../logger');
const debug = require('../../debug');

const Document = require('../../../model/document');
const { exportDocumentToOwl } = require('../../../util');

const Popover = require('../popover/popover');

// const DocumentWizardStepper = require('../document-wizard-stepper');
// const AppBar = require('../app-bar');
// const ActionLogger = require('../action-logger');


const ProteinModificationForm = require('./protein-modification-form');
const ExpressionRegulationForm = require('./expression-regulation-form');
const MolecularInteractionForm = require('./molecular-interaction-form');
const ActivationInhibitionForm = require('./activation-inhibition-form');

let Interaction = require('../../../model/element/interaction');

class FormEditor extends DirtyComponent {
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

    this.data = this.state = {
      document: doc,
      bus: bus
    };



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

        doc.on('remove', () => {
          this.forceUpdate();
        });


        //TODO
        doc.on('add', (el) => {

          el.on('complete', () => {

            el.on('remoteupdate', () => {
              this.dirty();
            });


            this.dirty();
          });



        });

        // force an update here
        this.forceUpdate();
        logger.info('The editor is initialising');
      } );

  }

  setData( obj, callback ){
    _.assign( this.data, obj );

    this.setState( obj, callback );
  }

  addElement( data){

    let doc = this.data.document;

    let el = doc.factory().make({
      data: _.assign( {
        type: 'entity',
        name: ''

      }, data )
    });

    return ( Promise.try( () => el.synch() )
        .then( () => el.create() )
        .then( () => doc.add(el) )
        .then( () => el )
    );
  }

  addInteraction( data ){

    let doc = this.data.document;

    let el = doc.factory().make({
      data: _.assign( {
        type: 'interaction',

      }, data )
    });

    return ( Promise.try( () => el.synch() )
        .then( () => el.create() )
        .then( () => doc.add(el) )
        .then( () => el.associate(data.association[0].value) )
        .then( () => el )

    );

  }


  addInteractionRow(data){
    let entArr = [];

    for(let i = 0; i < data.pptTypes.length; i++)
      entArr.push(this.addElement());

    let intn = this.addInteraction(data);


    entArr.push(intn);


    Promise.all(entArr).then(responses => {
      let resp = responses[data.pptTypes.length]; // this is the interaction

      for(let i = 0; i < data.pptTypes.length; i++) {
        resp.addParticipant(responses[i]);

        resp.setParticipantType(responses[i], data.pptTypes[i]);



        // if(data.pptTypes[i] !== Interaction.PARTICIPANT_TYPE.UNSIGNED)
        //   resp.association().setTarget( responses[i]);

      }


      this.dirty();
    });
  }

  updateState(){
    this.dirty();
  }

  deleteInteractionRow(data){

    let doc = this.state.document;
    let intn = data.interaction;

    let els = intn.participants();
    let elsLength = els.length;


    // intn.map(el => { if(intn.has(el))
    // {intn.remove(el); Promise.resolve();}});

    let promiseArr = [];
    for(let i = 0; i < elsLength; i++) {
      let participationCnt = doc.interactions().filter((interaction) => interaction.has( els[i] )).length;

      promiseArr.push(Promise.try(() => intn.removeParticipant(els[i]))
        .then(()=>{
          if(participationCnt <= 1)
              doc.remove(els[i]);
          }
        ));
    }

    Promise.all(promiseArr).then( () => {
      try{
        doc.remove(intn);
      }
      catch(e) {
        // console.log(e);
      }

      this.dirty();
    });

  }

  render(){
    let doc = this.state.document;

    let { history } = this.props;


    this.state.dirty = false;

    const forms = [
      {type: 'Protein Modification' , clazz: ProteinModificationForm, pptTypes:[Interaction.PARTICIPANT_TYPE.UNSIGNED, Interaction.PARTICIPANT_TYPE.POSITIVE],  description:"One protein chemically modifies another protein.", association: [Interaction.ASSOCIATION.PHOSPHORYLATION, Interaction.ASSOCIATION.UBIQUINATION, Interaction.ASSOCIATION.METHYLATION] },
      {type:'Molecular Interaction', clazz: MolecularInteractionForm, pptTypes: [Interaction.PARTICIPANT_TYPE.UNSIGNED, Interaction.PARTICIPANT_TYPE.UNSIGNED], description: "Two or more proteins physically interact.", association: [Interaction.ASSOCIATION.INTERACTION]},
      {type:'Activation Inhibition', clazz:ActivationInhibitionForm, pptTypes: [Interaction.PARTICIPANT_TYPE.UNSIGNED, Interaction.PARTICIPANT_TYPE.POSITIVE], description: "A protein changes the activity status of another protein.", association: [Interaction.ASSOCIATION.MODIFICATION]},
      {type:'Expression Regulation', clazz: ExpressionRegulationForm, pptTypes: [Interaction.PARTICIPANT_TYPE.UNSIGNED, Interaction.PARTICIPANT_TYPE.POSITIVE], description: "A protein changes mRNA expression of a gene.", association: [Interaction.ASSOCIATION.EXPRESSION]}
    ];

    let hArr = [];


    forms.forEach((form) => {

      let formContent = doc.interactions().map(interaction => {
          if(form.association.filter(assoc => assoc.value === interaction.association().value).length > 0 )
        // if(form.type === interaction.name())
          return h('div.form-interaction-line',
            [
              h('button.delete-interaction', { onClick: () => {this.deleteInteractionRow({interaction:interaction}); } }, 'X'),
              h(form.clazz, {key: interaction.id(), document:doc, interaction:interaction, description: form.type})

            ] );
        else return null;
      });


      //update form
      let hFunc = h('div.form-template-entry', [
        h('h2', form.type),
        h('p', form.description),
        ...formContent,
        h('div.form-action-buttons', [
          h('button.form-interaction-adder', {
            onClick: () => this.addInteractionRow({name:form.type, pptTypes:form.pptTypes,  association: form.association})}, [
            h('i.material-icons.add-new-interaction-icon', 'add'),
            'ADD INTERACTION'
          ])])
      ]);

      hArr.push(hFunc);
    });

    return h('div.form-editor', [
//      h(AppBar, { document: this.data.document, bus: this.data.bus }),
 //     h(ActionLogger, { document: this.data.document, bus: this.data.bus }),
      h('div.page-content', [
        h('div.app-bar', [
          h('h2', 'Factoid - Form Editor'),
          h(Popover, {
            tippy: {
              position: 'right',
              followCursor: false,
              html: h('div.editor-more-menu', [
                h('div.editor-more-menu-items', [
                  h('button.editor-more-button.plain-button', {
                    onClick: () => history.push('/new')
                  }, [
                    h('span', ' New factoid')
                  ]),
                  h('button.editor-more-button.plain-button', {
                    onClick: () => history.push('/documents')
                  }, [
                    h('span', ' My factoids')
                  ]),
                  h('button.editor-more-button.plain-button', {
                    onClick: () => {
                      if( doc.editable() ){
                        history.push(`/document/${doc.id()}/${doc.secret()}`);
                      } else {
                        history.push(`/document/${doc.id()}`);
                      }
                    }
                  }, [
                    h('span', ' Network editor')
                  ]),
                  h('button.editor-more-button.plain-button', {
                    onClick: () => history.push('/')
                  }, [
                    h('span', ' About & contact')
                  ])
                ])
              ])
            }
            }, [
            // h(Tooltip, { description: 'More tools' }, [
              h('button.editor-button.plain-button', [
                h('i.material-icons', 'more_vert')
              ])
            // ])
          ])
        ]),
        h('div.form-templates', [
          ...hArr
        ]),
        h('button.form-submit', { onClick: () => exportDocumentToOwl(doc.id()) }, [
          'SUBMIT'
        ])
      ]),

    ]);
  }
}

module.exports = FormEditor;
