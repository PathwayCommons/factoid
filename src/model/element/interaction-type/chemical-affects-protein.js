const InteractionType = require('./interaction-type');
const { PARTICIPANT_TYPE } = require('../participant-type');

const VALUE = 'chemicalaffectsprotein';
const DISPLAY_VALUE = 'Chemical activates/inhibits protein';

class ChemicalAffectsProtein extends InteractionType {
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
    let isChemical = ent => ent.type() === 'chemical';

    return ppts.length === 2 && ppts.some( isProtein ) && ppts.some( isChemical );
  }

  toString(){
    return super.toString( this.isActivation() ? 'activates' : 'inhibits' );
  }

  static get value(){ return VALUE; }
  get value(){ return VALUE; }

  static get displayValue(){ return DISPLAY_VALUE; }
  get displayValue(){ return DISPLAY_VALUE; }
}

module.exports = ChemicalAffectsProtein;
