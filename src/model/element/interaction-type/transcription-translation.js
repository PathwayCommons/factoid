const InteractionType = require('./interaction-type');
const { PARTICIPANT_TYPE } = require('../participant-type');
const { ENTITY_TYPE } = require('../entity-type');
const { BIOPAX_TEMPLATE_TYPE, BIOPAX_CONTROL_TYPE } = require('./biopax-type');

const VALUE = 'transcription-translation';
const DISPLAY_VALUE = 'Transcription/translation';

class TranscriptionTranslation extends InteractionType {
  constructor( intn ){
    super( intn );
  }

  allowedParticipantTypes(){
    const T = PARTICIPANT_TYPE;

    return [T.POSITIVE, T.NEGATIVE];
  }

  isComplete(){
    return this.isSigned() && TranscriptionTranslation.isAllowedForInteraction(this.interaction);
  }

  static isAllowedForInteraction( intn ){
    let isProtein = ent => ent.type() === ENTITY_TYPE.PROTEIN;
    let ppts = intn.participants();

    return ppts.length === 2 && ppts.some(isProtein);
  }

  toBiopaxTemplate(){
    //src, tgt shouldn't be null at this point (barring bug)
    let srcTemplate = this.getSource().toBiopaxTemplate();
    let tgtTemplate = this.getTarget().toBiopaxTemplate();

    let template = {
      type: BIOPAX_TEMPLATE_TYPE.EXPRESSION_REGULATION,
      controller: srcTemplate,
      target: tgtTemplate
    };

    if(this.isInhibition())
      template.controlType = BIOPAX_CONTROL_TYPE.INHIBITION;
    else if(this.isActivation())
      template.controlType = BIOPAX_CONTROL_TYPE.ACTIVATION;

    return template;
  }

  toString(){
    return super.toString( (this.isInhibition() ? 'inhibits' : 'activates')
      + ' the transcription/translation of' );
  }

  static get value(){ return VALUE; }
  get value(){ return VALUE; }

  static get displayValue(){ return DISPLAY_VALUE; }
  get displayValue(){ return DISPLAY_VALUE; }
}

module.exports = TranscriptionTranslation;
