import InteractionType from './interaction-type';
import { PARTICIPANT_TYPE } from '../participant-type';
import { ENTITY_TYPE } from '../entity-type';
import { BIOPAX_TEMPLATE_TYPE, BIOPAX_CONTROL_TYPE } from './biopax-type';

const VALUE = 'modification';
const DISPLAY_VALUE = 'Post-translational modification';

const allowedParticipantTypes = () => {
  const T = PARTICIPANT_TYPE;

  return [T.POSITIVE, T.NEGATIVE];
};

class Modification extends InteractionType {
  constructor( intn ){
    super( intn );
  }

  static allowedParticipantTypes(){
    return allowedParticipantTypes();
  }

  allowedParticipantTypes(){
    return allowedParticipantTypes();
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
    if ( !this.validatePpts() ){
      return this.makeInvalidBiopaxTemplate();
    }

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
    if(this.isNegative())
      template.controlType = BIOPAX_CONTROL_TYPE.INHIBITION;
    else if(this.isPositive())
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

export default Modification;
