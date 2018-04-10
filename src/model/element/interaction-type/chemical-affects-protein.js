const InteractionType = require('./interaction-type');
const { PARTICIPANT_TYPE } = require('../participant-type');

const VALUE = 'chemicalaffectsprotein';
const DISPLAY_VALUE = 'Protein activation/inhibition';

class ChemicalAffectsProtein extends InteractionType {
  constructor( intn ){
    super( intn );
  }

  isInhibition(){
    return this.isNegative();
  }

  isActivation(){
    return this.isPositive();
  }

  allowedParticipantTypes(){
    const T = PARTICIPANT_TYPE;

    return [T.POSITIVE, T.NEGATIVE];
  }

  setAsInhibitionOf( ppt ){
    return this.setPariticpantAsNegative( ppt );
  }

  setAsActivationOf( ppt ){
    return this.setPariticpantAsPositive( ppt );
  }

  static isAllowedForInteraction( intn ){
    let ppts = intn.participants();
    let isProtein = ent => ent.type() === 'protein';
    let isChemical = ent => ent.type() === 'chemical';

    ppts.length === 2 && ppts.some( isProtein ) && ppts.some( isChemical );
  }

  static get value(){ return VALUE; }
  get value(){ return VALUE; }

  static get displayValue(){ return DISPLAY_VALUE; }
  get displayValue(){ return DISPLAY_VALUE; }
}

module.exports = ChemicalAffectsProtein;
