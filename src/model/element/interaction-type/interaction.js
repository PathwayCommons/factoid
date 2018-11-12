const InteractionType = require('./interaction-type');
const { BIOPAX_TEMPLATE_TYPE, BIOPAX_CONTROL_TYPE } = require('./biopax-type');

const VALUE = 'interaction';
const DISPLAY_VALUE = 'Other';

class Interaction extends InteractionType {

  constructor( intn ){
    super( intn );
  }

  toBiopaxTemplate(){
    // "Other" type; see 4A-E in "Factoid binary interaction types" doc.
    let participants = this.interaction.participants();
    let participantTemplates = participants.map( participant => participant.toBiopaxTemplate() );

    let controlType = this.isInhibition()
      ? BIOPAX_CONTROL_TYPE.INHIBITION
      : BIOPAX_CONTROL_TYPE.ACTIVATION;

    let template = {
      type: BIOPAX_TEMPLATE_TYPE.OTHER_INTERACTION,
      participants: participantTemplates
    };

    if(controlType)
      template.controlType = controlType;

    let source = this.getSource();
    if(source)
      template.controller = source.toBiopaxTemplate();

    let target = this.getTarget();
    if(target)
      template.target = target.toBiopaxTemplate();

    return template;
  }

  static get value(){ return VALUE; }
  get value(){ return VALUE; }

  static get displayValue(){ return DISPLAY_VALUE; }
  get displayValue(){ return DISPLAY_VALUE; }

  toString(){
    return super.toString('interacts with');
  }
}

module.exports = Interaction;
