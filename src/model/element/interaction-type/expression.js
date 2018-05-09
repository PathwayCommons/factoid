const InteractionType = require('./interaction-type');
const { PARTICIPANT_TYPE } = require('../participant-type');

const VALUE = 'expression';
const DISPLAY_VALUE = 'Expression';

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

  toString(){
    return super.toString( (this.isInhibition() ? 'inhibits' : 'promotes') + ' the expression of' );
  }

  static get value(){ return VALUE; }
  get value(){ return VALUE; }

  static get displayValue(){ return DISPLAY_VALUE; }
  get displayValue(){ return DISPLAY_VALUE; }
}

module.exports = Expression;
