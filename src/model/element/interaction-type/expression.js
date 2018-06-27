const InteractionType = require('./interaction-type');
const { PARTICIPANT_TYPE } = require('../participant-type');
const { BIOPAX_TEMPLATE_TYPE, BIOPAX_CONTROL_TYPE } = require('./biopax-type');

const VALUE = 'expression';
const DISPLAY_VALUE = 'Gene expression regulation';

class Expression extends InteractionType {
  constructor( intn ){
    super( intn );
  }

  allowedParticipantTypes(){
    const T = PARTICIPANT_TYPE;

    return [T.POSITIVE, T.NEGATIVE];
  }

  areParticipantsTyped(){
    return this.isSigned();
  }

  static isAllowedForInteraction( intn ){
    let ppts = intn.participants();
    let isProtein = ent => ent.type() === 'protein';

    return ppts.length === 2 && ppts.every( isProtein );
  }

  toBiopaxTemplate(){
    let source = this.getSource();
    let target = this.getTarget();

    let srcTemplate = source.toBiopaxTemplate();
    let tgtTemplate = target.toBiopaxTemplate();

    let controlType = this.isInhibition() ? BIOPAX_CONTROL_TYPE.INHIBITION : BIOPAX_CONTROL_TYPE.ACTIVATION;

    return {
      type: BIOPAX_TEMPLATE_TYPE.EXPRESSION_REGULATION,
      transcriptionFactor: srcTemplate,
      targetProtein: tgtTemplate,
      controlType: controlType
    };
  }

  toString(){
    return super.toString( (this.isInhibition() ? 'inhibits' : 'promotes') + ' the expression of' );
  }

  static get value(){ return VALUE; }
  get value(){ return VALUE; }

  static get displayValue(){ return DISPLAY_VALUE; }
  get displayValue(){ return DISPLAY_VALUE; }
}

module.exports = Expression;
