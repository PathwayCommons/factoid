const { Component } = require('react');
const _ = require('lodash');

class InteractionForm extends Component {
  constructor(props){
    super(props);
    this.state = this.data = {
      id: props.id,
      interaction: props.interaction,
      description: props.description,
      document: props.document,
      bus: props.bus,
      // isEntityInfoVisible: props.isEntityInfoVisible
    };


    // this.state.document.synch();

    this.state.interaction.complete();
  }

  getInputParticipant(){
    let intn = this.state.interaction;
    //get source gives an error for unsigned partcipants
    // return intn.association().getSource();

    let target = intn.association().getTarget();
    return intn.participants().filter(el =>  el !== target)[0];

  }

  getOutputParticipant(){
    let intn = this.state.interaction;

    return intn.association().getTarget();
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
    let rEnt = this.getOutputParticipant();

    // Promise.try( () => {
      if (val.indexOf("activ") > -1) {
        intn.setParticipantType(rEnt, 'positive');
        // intn.association().setAsPromotionOf(rEnt);

      }
      else {
        intn.setParticipantType(rEnt, 'negative');
        // intn.association().setAsInhibitionOf(rEnt);
      }

      this.state.interaction.complete();

      this.forceUpdate();
  }
}

module.exports = InteractionForm;

