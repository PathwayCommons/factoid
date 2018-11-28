const { error } = require('../../../util');
const { PARTICIPANT_TYPE } = require('../participant-type');

const VALUE = 'unset';
const DISPLAY_VALUE = 'Unset';

// abstract base class
class InteractionType {
  constructor( interaction ){
    if( !interaction ){
      throw error(`Can not create interaction type without an 'interaction' reference`);
    }

    this.interaction = interaction;
  }

  allowedParticipantTypes(){ // i.e. settable by the user
    return [ PARTICIPANT_TYPE.UNSIGNED, PARTICIPANT_TYPE.POSITIVE, PARTICIPANT_TYPE.NEGATIVE ];
  }

  has( pptType ){
    return this.interaction.participantsOfType(pptType).length > 0;
  }

  isPositive(){
    return this.has( PARTICIPANT_TYPE.POSITIVE );
  }

  isNegative(){
    return this.has( PARTICIPANT_TYPE.NEGATIVE );
  }

  isUnsignedTarget(){
    return this.has( PARTICIPANT_TYPE.UNSIGNED_TARGET );
  }

  isSigned(){
    return this.isPositive() || this.isNegative();
  }

  getSignValue() {
    let value =  PARTICIPANT_TYPE.UNSIGNED.value;
    if (this.isNegative())
      value = PARTICIPANT_TYPE.NEGATIVE.value;
    else if (this.isPositive())
      value = PARTICIPANT_TYPE.POSITIVE.value;
    else if (this.isUnsignedTarget())
      value = PARTICIPANT_TYPE.UNSIGNED_TARGET.value;

    return value;
  }

  isComplete(){
    return false;
  }

  setParticipantAs( ppt, type ){
    let intn = this.interaction;
    let signedPpts = intn.participantsNotOfType( PARTICIPANT_TYPE.UNSIGNED ).filter( unsignedPpt => unsignedPpt.id() !== ppt.id() );
    let makeUnsigned = ppt => intn.retypeParticipant( ppt, PARTICIPANT_TYPE.UNSIGNED );

    return Promise.all([
      intn.retypeParticipant( ppt, type ),
      signedPpts.map( makeUnsigned )
    ]);
  }

  getTarget(){
    let intn = this.interaction;
    let ppts = intn.participantsNotOfType( PARTICIPANT_TYPE.UNSIGNED );
    // assoc. cannot have more than one target,
    // but this must be checked somewhere else (no need to throw an exception here)
    return( ppts.length > 1 ) ? null : ppts[0];
  }

  setTarget( ppt ){
    if( this.isNegative() ){
      return this.setParticipantAs( ppt, PARTICIPANT_TYPE.NEGATIVE );
    } else if( this.isPositive() ){
      return this.setParticipantAs( ppt, PARTICIPANT_TYPE.POSITIVE );
    } else {
      return this.setParticipantAs( ppt, PARTICIPANT_TYPE.UNSIGNED_TARGET );
    }
  }

  getSource(){
    let intn = this.interaction;
    let ppts = intn.participantsOfType( PARTICIPANT_TYPE.UNSIGNED );
    // assoc. cannot have more than one source,
    // but this must be checked somewhere else (no need to throw an exception here)
    return ( ppts.length > 1 ) ? null : ppts[0];
  }

  toBiopaxTemplate() {
    throw new Error(`Abstract method toBiopaxTemplate() is not overridden for interaction type of ${this.value}`);
  }

  toString(verbPhrase, pref = '', post = ''){
    let src, tgt;

    if(this.isSigned()) {
      src = this.getSource();
      tgt = this.getTarget();
      if(!src || !tgt) //any null or undefined
        throw new Error(`Source or target is undefined for signed interaction type ${this.value}`);
    } else { //currently, unsigned also means undirected (signed - always directed, directed - signed)
      let ppts = this.interaction.participants();
      src = ppts[0];
      tgt = ppts[1];
    }

    if (!verbPhrase) {
      if (this.isPositive())
        verbPhrase = PARTICIPANT_TYPE.POSITIVE.verb;
      else if (this.isNegative())
        verbPhrase = PARTICIPANT_TYPE.NEGATIVE.verb;
      else if (this.isUnsignedTarget())
        verbPhrase = PARTICIPANT_TYPE.UNSIGNED_TARGET.verb;
      else
        verbPhrase = PARTICIPANT_TYPE.UNSIGNED.verb;
    }

    let srcName = src.name() || '(?)';
    let tgtName = tgt.name() || '(?)';

    return `${srcName} ${verbPhrase} ${pref} ${tgtName} ${post}`;
  }

  static isAllowedForInteraction( intn ){ // eslint-disable-line no-unused-vars
    return false;
  }

  static get value(){ return VALUE; }
  get value(){ return VALUE; }

  static get displayValue(){ return DISPLAY_VALUE; }
  get displayValue(){ return DISPLAY_VALUE; }
}

module.exports = InteractionType;
