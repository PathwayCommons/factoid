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
    this.state = {
      entityName: ''
    };
  }
  render(){
    return h('input[type="text"].form-entity', {
      value: this.state.entityName,
      onChange: e => this.setState({
        entityName: e.target.value
      })
    });
  }
}

class InteractionForm extends Component {
  constructor(props){
    super(props);
    this.state = {
      interactionType: 'interacts with'
    };
  }

  render(){
    return h('div.form-interaction', [
      h(EntityForm),
      h('span', [
        h('select', [
          h('option', { value: 'interacts with', selected: this.state.interactionType === 'interacts with' }, 'interacts with'),
          h('option', { value: 'phosphorylates', selected: this.state.interactionType === 'phosphorylates' }, 'phosphorylates'),
          h('option', { value: 'enzyme reaction', selected: this.state.interactionType === 'enzyme reaction' }, 'enzyme reaction')
        ])
      ]),
      h(EntityForm)
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
        logger.info('The editor is initialising');
      } );

    this.state = {
      numInteractions: 0
    };
  }

  render(){
    const interactionForms = [];

    for (let i = 0; i < this.state.numInteractions; i++) {
      interactionForms.push(h(InteractionForm));
    }

    return h('div.document-form.page-content', [
      h('h1', 'Insert Pathway Information As Text'),
      ...interactionForms,
      h('button.form-interaction-adder', { onClick: e => this.setState({ numInteractions: this.state.numInteractions + 1 }) }, [
        h('i.material-icons', 'add'),
        'add interaction'
      ]),
      h(DocumentWizardStepper, {
        backEnabled: false,
        // TODO
      })
    ]);
  }
}

module.exports = FormEditor;
