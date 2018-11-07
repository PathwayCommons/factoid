const InteractionType = require('./interaction-type');
const { BIOPAX_TEMPLATE_TYPE } = require('./biopax-type');

const VALUE = 'interaction';
const DISPLAY_VALUE = 'Other';

class Interaction extends InteractionType {
  constructor( intn ){
    super( intn );
  }

  toBiopaxTemplate(){
    // TODO BIOPAX
    let participants = this.interaction.participants();
    let participantTemplates = participants.map( participant => participant.toBiopaxTemplate() );

    return {
      type: BIOPAX_TEMPLATE_TYPE.MOLECULAR_INTERACTION,
      moleculeList: participantTemplates
    };
  }

  static get value(){ return VALUE; }
  get value(){ return VALUE; }

  static get displayValue(){ return DISPLAY_VALUE; }
  get displayValue(){ return DISPLAY_VALUE; }
}

module.exports = Interaction;
