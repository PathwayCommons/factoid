const InteractionType = require('./interaction-type');
const { PARTICIPANT_TYPE } = require('../participant-type');
const { ENTITY_TYPE } = require('../entity-type');
const { BIOPAX_TEMPLATE_TYPE, BIOPAX_CONTROL_TYPE } = require('./biopax-type');

const VALUE = 'modification';
const DISPLAY_VALUE = 'Other modification (PTM)';


class Modification extends InteractionType {
  constructor( intn ){
    super( intn );
  }

  allowedParticipantTypes(){
    const T = PARTICIPANT_TYPE;

    return [T.POSITIVE, T.NEGATIVE];
  }

  isComplete(){
    return this.isSigned() && Modification.isAllowedForInteraction(this.interaction);
  }

  static isAllowedForInteraction( intn ){
    let ppts = intn.participants();
    let isProtein = ent => ent.type() === ENTITY_TYPE.PROTEIN;

    return ppts.length === 2 && ppts.every( isProtein );
  }

  toBiopaxTemplate(effect){//effect is undefined in base Modification case (i.e., no phys. mod. feature)
    // src and tgt must be both set, not null, by this point
    let srcTemplate = this.getSource().toBiopaxTemplate();
    let tgtTemplate = this.getTarget().toBiopaxTemplate();

    let template = {
      type: BIOPAX_TEMPLATE_TYPE.PROTEIN_CONTROLS_STATE,
      controller: srcTemplate, //controller protein
      target: tgtTemplate
    };

    //here controlType is not bp:controlType but is about the
    //target's state change between 'inactive' and 'active'.
    if(this.isInhibition())
      template.controlType = BIOPAX_CONTROL_TYPE.INHIBITION;
    else if(this.isActivation())
      template.controlType = BIOPAX_CONTROL_TYPE.ACTIVATION;

    if (effect) {
      template.modification = effect;
    }

    return template;
  }

  toString( mod = 'modification' ){
    return super.toString(null, `via ${mod}`);
  }

  static get value(){ return VALUE; }
  get value(){ return VALUE; }

  static get displayValue(){ return DISPLAY_VALUE; }
  get displayValue(){ return DISPLAY_VALUE; }
}

module.exports = Modification;
