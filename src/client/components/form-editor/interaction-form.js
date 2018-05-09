const { Component } = require('react');
const _ = require('lodash');
let Interaction = require('../../../model/element/interaction');

class InteractionForm extends Component {
  constructor(props){
    super(props);
    this.state = this.data = {
      id: props.id,
      interaction: props.interaction,
      description: props.description,
      document: props.document,
      caller: props.caller
    };

    this.state.document.synch();
  }

  getInputParticipants(){
    let intn = this.state.interaction;
    return intn.participants().filter(el =>  (intn.getParticipantType(el) === Interaction.PARTICIPANT_TYPE.UNSIGNED));
  }

  getOutputParticipants(){
    let intn = this.state.interaction;
    return intn.participants().filter(el =>  (intn.getParticipantType(el)===  Interaction.PARTICIPANT_TYPE.POSITIVE || intn.getParticipantType(el) ===  Interaction.PARTICIPANT_TYPE.NEGATIVE));
  }


  addEntityRow(data){
    let doc = this.state.document;

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
      .then( () => this.state.interaction.addParticipant(el) )
      .then(() => this.setState(this.state));
  }



  updateActivationInhibition(val){
    let intn = this.state.interaction;
    let rEnt = this.getEntityForParticipantIndex(1);

    // Promise.try( () => {
      if (val.indexOf("activ") > -1) {
        intn.setParticipantType(rEnt, 'positive');
        // intn.association().setAsPromotionOf(rEnt);

      }
      else {
        intn.setParticipantType(rEnt, 'negative');
        // intn.association().setAsInhibitionOf(rEnt);
      }

      // setTimeout(()=> {
          this.forceUpdate();
        // }, 1000);
    // })
    // .then(() => this.forceUpdate());

  }
}

module.exports = InteractionForm;

