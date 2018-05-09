const InteractionType = require('./interaction-type');
const { PARTICIPANT_TYPE } = require('../participant-type');

const VALUE = 'modification';
const DISPLAY_VALUE = 'Modification';

class Modification extends InteractionType {
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
    let isProtein = ent => true || ent.type() === 'protein';

    return ppts.length === 2 && ppts.every( isProtein );
  }

  toString( mod = 'modification' ){
    let verb = (this.isInhibition() ? 'inhibits' : 'promotes');
    let obj = `the ${mod} of`;

    return super.toString( `${verb} ${obj}` );
  }

  static get value(){ return VALUE; }
  get value(){ return VALUE; }

  static get displayValue(){ return DISPLAY_VALUE; }
  get displayValue(){ return DISPLAY_VALUE; }
}

module.exports = Modification;
