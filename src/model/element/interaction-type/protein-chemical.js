const InteractionType = require('./interaction-type');
const { PARTICIPANT_TYPE } = require('../participant-type');

const VALUE = 'chemicalprotein';
const DISPLAY_VALUE = 'Protein and chemical';

class ProteinChemical extends InteractionType {
  constructor( intn ){
    super( intn );
  }

  isConsumption(){
    return this.isNegative();
  }

  isProduction(){
    return this.isPositive();
  }

  setAsConsumptionOf( ppt ){
    return this.setPariticpantAsNegative( ppt );
  }

  setAsProductionOf( ppt ){
    return this.setParticipantAsPositive( ppt );
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
    let isChemical = ent => ent.type() === 'chemical';

    return ppts.length === 2 && ppts.some( isProtein ) && ppts.some( isChemical );
  }

  toString(){
    let verb;

    if( this.getTarget().type() === 'chemical' ){
      verb = this.isNegative() ? 'consumes' : 'produces';
    } else {
      verb = this.isNegative() ? 'inhibits' : 'activates';
    }

    return super.toString( verb );
  }

  static get value(){ return VALUE; }
  get value(){ return VALUE; }

  static get displayValue(){ return DISPLAY_VALUE; }
  get displayValue(){ return DISPLAY_VALUE; }
}

module.exports = ProteinChemical;
