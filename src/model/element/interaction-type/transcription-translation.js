import InteractionType from './interaction-type';
import { PARTICIPANT_TYPE } from '../participant-type';
import { ENTITY_TYPE } from '../entity-type';
import { BIOPAX_TEMPLATE_TYPE, BIOPAX_CONTROL_TYPE } from './biopax-type';

const VALUE = 'transcription-translation';
const DISPLAY_VALUE = 'Transcription/translation';

const allowedParticipantTypes = () => {
  const T = PARTICIPANT_TYPE;

  return [T.POSITIVE, T.NEGATIVE];
};

class TranscriptionTranslation extends InteractionType {
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
    return this.isSigned() && TranscriptionTranslation.isAllowedForInteraction(this.interaction);
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
    let validTgtTypes = [ENTITY_TYPE.GGP, ENTITY_TYPE.PROTEIN, ENTITY_TYPE.RNA];

    return validSrcTypes.includes( sourceType ) && validTgtTypes.includes( targetType );
  }

  toBiopaxTemplate( transform, omitDbXref ){
    if ( !this.validatePpts() ){
      return this.makeInvalidBiopaxTemplate( omitDbXref );
    }

    //src, tgt shouldn't be null at this point (barring bug)
    // let src = this.getSource();
    // let tgt = this.getTarget();
    let src = transform( this.getSource() );
    let tgt = transform( this.getTarget() );

    // skip if the source and target became the same after the transformation
    if ( src.id() == tgt.id() ) {
      return null;
    }

    let srcTemplate = src.toBiopaxTemplate( omitDbXref );
    let tgtTemplate = tgt.toBiopaxTemplate( omitDbXref );

    let template = {
      type: BIOPAX_TEMPLATE_TYPE.EXPRESSION_REGULATION,
      controller: srcTemplate,
      target: tgtTemplate
    };

    if(this.isNegative())
      template.controlType = BIOPAX_CONTROL_TYPE.INHIBITION;
    else if(this.isPositive())
      template.controlType = BIOPAX_CONTROL_TYPE.ACTIVATION;

    return template;
  }

  toString(){
    return super.toString(this.getSign().verbPhrase + ' the transcription/translation of');
  }

  static get value(){ return VALUE; }
  get value(){ return VALUE; }

  static get displayValue(){ return DISPLAY_VALUE; }
  get displayValue(){ return DISPLAY_VALUE; }
}

export default TranscriptionTranslation;
