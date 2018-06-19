const DirtyComponent = require('../dirty-component');
const _ = require('lodash');
const Promise = require('bluebird');

class InteractionForm extends DirtyComponent {
  constructor(props){
    super(props);

    this.data = {
      id: props.id,
      interaction: props.interaction,
      description: props.description,
      document: props.document,
      bus: props.bus
    };

    this.onDirty = () => {
      this.dirty();
    };

    this.data.bus.on('dirty', this.onDirty);
  }

  componentDidMount(){
    // this.data.bus.on('dirty', this.onDirty);
  }

  componentWillUnmount(){
    this.data.bus.removeListener('dirty', this.onDirty);
  }

  getInputParticipant(){
    try {
      return this.data.interaction.association().getSource();
    } catch(err){
      return null;
    }
  }

  getOutputParticipant(){
    try {
      return this.data.interaction.association().getTarget();
    } catch(err){
      return null;
    }
  }

  completeIfReady(){
    let intn = this.data.interaction;

    if(!intn.completed() && intn.associated() && intn.association().isSigned()){
      return intn.complete();
    } else {
      return Promise.resolve();
    }
  }

  addEntityRow(data){
    let doc = this.data.document;

    let el = doc.factory().make({
      data: _.assign( {
        type: 'entity',
        name: ''

      }, data )
    });

    Promise.try( () => el.synch() )
      .then( () => el.create() )
      .then( () => doc.add(el) )
      .then( () => el )
      .then( () => this.data.interaction.addParticipant(el) )
      .then(() => this.dirty());
  }

  updateActivationInhibition(val){
    let intn = this.data.interaction;
    let rEnt = this.getOutputParticipant();
    let assoc = intn.association();

    let setPptType = () => val.indexOf("activ") > -1 ? assoc.setParticipantAsPositive(rEnt) : assoc.setParticipantAsNegative(rEnt);
    let complete = () => this.completeIfReady();
    let dirty = () => this.dirty();

    return Promise.try( setPptType ).then( complete ).then( dirty );
  }
}

module.exports = InteractionForm;
