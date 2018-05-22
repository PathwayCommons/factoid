const InteractionType = require('./interaction-type');
const { BIOPAX_TEMPLATE_TYPE } = require('./biopax-type');

const VALUE = 'interaction';
const DISPLAY_VALUE = 'General';

class General extends InteractionType {
  constructor( intn ){
    super( intn );
  }

  toBiopaxTemplate(){
    let participants = this.interaction.participants();
    let participantNames = participants.map( participant => participant.name() );

    return {
      type: BIOPAX_TEMPLATE_TYPE.MOLECULAR_INTERACTION,
      moleculeList: participantNames
    };
  }

  static get value(){ return VALUE; }
  get value(){ return VALUE; }

  static get displayValue(){ return DISPLAY_VALUE; }
  get displayValue(){ return DISPLAY_VALUE; }
}

module.exports = General;
