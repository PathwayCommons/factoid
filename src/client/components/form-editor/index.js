const { Component } = require('react');
const h = require('react-hyperscript');
const io = require('socket.io-client');
const _ = require('lodash');


const logger = require('../../logger');
const debug = require('../../debug');

const Document = require('../../../model/document');

const DocumentWizardStepper = require('../document-wizard-stepper');


class EntityForm extends Component {
  constructor(props){
    super(props);
    this.state = this.data = {
      entity: props.entity
    };
  }

  updateEntityName( newName ){
    this.state.entity.name( newName );
    this.forceUpdate();
  }
  render(){
    return h('input[type="text"].form-entity', {
      value: this.state.entity.name(),
      placeholder: 'Enter entity name',
      onChange: e => this.updateEntityName(e.target.value)
    });
  }
}

class InteractionForm extends Component {
  constructor(props){
    super(props);
    this.state = this.data = {
      interaction: props.interaction
    };
  }

  updateInteractionType(nextType){
    const intn = this.state.interaction;
    intn.description(nextType);
    this.forceUpdate();
  }

  deleteInteraction() {
    // TODO implement this
  }

  render(){
    const intn = this.state.interaction;
    const lEnt = intn.elements()[0];
    const rEnt = intn.elements()[1];

    return h('div.form-interaction', [
      h(EntityForm, { entity: lEnt }),
      h('span', [
        h('select', { value: intn.description(), onChange: e => this.updateInteractionType(e.target.value) }, [
          h('option', { value: 'interacts with' }, 'interacts with'),
          h('option', { value: 'phosphorylates' }, 'phosphorylates'),
          h('option', { value: 'enzyme reaction' }, 'enzyme reaction'),
          h('option', { value: 'other' }, 'other')
        ])
      ]),
      h(EntityForm, { entity: rEnt } ),
      h('button.delete-interaction', { onClick: () => this.deleteInteraction() }, 'X')
    ]);
  }
}


// TODO actually build a working UI that's hooked into the model
class FormEditor extends Component {
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

    this.data = this.state = {
      document: doc
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

        // force an update here

        this.forceUpdate();
        logger.info('The editor is initialising');
      } );

  }

  setData( obj, callback ){
    _.assign( this.data, obj );

    this.setState( obj, callback );
  }

  addElement( data = {} ){

    let doc = this.data.document;

    let el = doc.factory().make({
      data: _.assign( {
        type: 'entity',
        name: '',
      }, data )
    });

    return ( Promise.try( () => el.synch() )
      .then( () => el.create() )
      .then( () => doc.add(el) )
      .then( () => el )
    );
  }

  addInteraction( data = {} ){

    return this.addElement( _.assign({
      type: 'interaction',
      name: ''
    }, data) );
  }

  addInteractionRow(){

    let lEnt = this.addElement();
    let rEnt = this.addElement();
    let intn = this.addInteraction();

    Promise.all([lEnt, rEnt, intn]).then(responses => {
      let i = responses[2];

      i.addParticipant(responses[0]);
      i.addParticipant(responses[1]);

      this.forceUpdate();
    });

  }

  render(){
    const doc = this.state.document;
    const interactions = doc.interactions();

    const interactionForms = interactions.map(interaction => {
      return h(InteractionForm, { interaction });
    });

    return h('div.document-form.page-content', [
      h('h1.form-editor-title', 'Insert Pathway Information As Text'),
      ...interactionForms,
      h('div.form-action-buttons', [
        h('button.form-interaction-adder', { onClick: () => this.addInteractionRow() }, [
          h('i.material-icons.add-new-interaction-icon', 'add'),
          'ADD INTERACTION'
        ]),
        h('button.form-submit', { onClick: () => this.addInteractionRow() }, [
          'SUBMIT'
        ])
      ]),
      h(DocumentWizardStepper, {
        backEnabled: false,
        // TODO
      })
    ]);
  }
}

module.exports = FormEditor;
