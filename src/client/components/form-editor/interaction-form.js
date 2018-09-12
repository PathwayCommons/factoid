const DirtyComponent = require('../dirty-component');
const _ = require('lodash');
const { tryPromise } = require('../../../util');

const dirtyEvents = ['remoteassociate', 'remoteretype'];

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

    this.dirtyHandler = () => this.dirty();
  }

  componentDidMount(){
    let intn = this.data.interaction;

    dirtyEvents.forEach(e => intn.on(e, this.dirtyHandler));
  }

  componentWillUnmount(){
    let intn = this.data.interaction;

    dirtyEvents.forEach(e => intn.removeListener(e, this.dirtyHandler));
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

    tryPromise( () => el.synch() )
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

    return tryPromise( setPptType ).then( complete ).then( dirty );
  }
}

module.exports = InteractionForm;
