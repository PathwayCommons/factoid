const InteractionType = require('./interaction-type');
const { PARTICIPANT_TYPE } = require('../participant-type');
const { ENTITY_TYPE } = require('../entity-type');

const VALUE = 'binding';
const DISPLAY_VALUE = 'Binding';

class Binding extends InteractionType {
  constructor( intn ){
    super( intn );
  }

  allowedParticipantTypes(){
    const T = PARTICIPANT_TYPE;

    return [T.UNSIGNED];
  }

  static isAllowedForInteraction( intn ){
    let ppts = intn.participants();
    let isProtein = ent => ent.type() === ENTITY_TYPE.PROTEIN;

    return ppts.length === 2 && ppts.every( isProtein );
  }

  toBiopaxTemplate(){
    // TODO BIOPAX
  }

  toString(){
    return super.toString('binds with');
  }

  static get value(){ return VALUE; }
  get value(){ return VALUE; }

  static get displayValue(){ return DISPLAY_VALUE; }
  get displayValue(){ return DISPLAY_VALUE; }
}

module.exports = Binding;
