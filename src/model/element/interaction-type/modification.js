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

  static isAllowedForInteraction( intn, transform ){
    let assoc = intn.association();
    let src = assoc.getSource();
    let tgt = assoc.getTarget();

    // a valid modification should be directed
    if ( src == null || tgt == null ) {
      return false;
    }

    let sourceType = transform( src ).type();
    let targetType = transform( tgt ).type();

    let validSrcTypes = [ENTITY_TYPE.GGP, ENTITY_TYPE.PROTEIN, ENTITY_TYPE.DNA, ENTITY_TYPE.RNA, ENTITY_TYPE.COMPLEX];
    let validTgtTypes = [ENTITY_TYPE.GGP, ENTITY_TYPE.PROTEIN, ENTITY_TYPE.DNA, ENTITY_TYPE.RNA];

    return validSrcTypes.includes( sourceType ) && validTgtTypes.includes( targetType );
  }

  toBiopaxTemplate(transform, omitDbXref, effect){//effect is undefined in base Modification case (i.e., no phys. mod. feature)
    if ( !this.validatePpts( transform ) ){
      return this.makeInvalidBiopaxTemplate( transform, omitDbXref );
    }

    //src, tgt shouldn't be null at this point (barring bug)
    let src = transform( this.getSource() );
    let tgt = transform( this.getTarget() );

    // skip if the source and target became the same after the transformation
    if ( src.id() == tgt.id() ) {
      return null;
    }

    let srcTemplate = src.toBiopaxTemplate( omitDbXref );
    let tgtTemplate = tgt.toBiopaxTemplate( omitDbXref );

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
