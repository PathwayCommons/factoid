const InteractionType = require('./interaction-type');
const { PARTICIPANT_TYPE } = require('../participant-type');
const { MODS } = require('../entity-mods');

const VALUE = 'modification';
const DISPLAY_VALUE = 'Modification';

class Modification extends InteractionType {
  constructor( intn ){
    super( intn );
  }

  isPromotion(){
    return this.isPositive();
  }

  isInhibition(){
    return this.isNegative();
  }

  setAsPromotionOf( ppt ){
    return this.setPariticpantAsPositive( ppt );
  }

  setAsInhibitionOf( ppt ){
    return this.setPariticpantAsNegative( ppt );
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

  toString(){
    let tgt = this.getTarget();
    let verb = (this.isInhibition() ? 'inhibits' : 'promotes');

    let mod;

    switch( tgt.modification().value ){
      case MODS.PHOSPHORYLATED.value:
        mod = 'phosphorylation';
        break;
      case MODS.METHYLATED.value:
        mod = 'methylation';
        break;
      case MODS.UBIQUINATED.value:
        mod = 'ubiquination';
        break;
      default:
        mod = 'modification';
        break;
    }

    let obj = `the ${mod} of`;

    return super.toString( `${verb} ${obj}` );
  }

  static get value(){ return VALUE; }
  get value(){ return VALUE; }

  static get displayValue(){ return DISPLAY_VALUE; }
  get displayValue(){ return DISPLAY_VALUE; }
}

module.exports = Modification;
