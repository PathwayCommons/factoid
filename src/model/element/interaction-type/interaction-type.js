const { error } = require('../../../util');
const { PARTICIPANT_TYPE, PARTICIPANT_TYPES } = require('../participant-type');

const VALUE = 'unset';
const DISPLAY_VALUE = 'Unset';

class InteractionType {
  constructor( interaction ){
    if( !interaction ){
      throw error(`Can not create interaction type without an 'interaction' reference`);
    }

    this.interaction = interaction;
  }

  allowedParticipantTypes(){
    return PARTICIPANT_TYPES;
  }

  has( pptType ){
    let intn = this.interaction;

    return intn.participantsOfType(pptType).length > 0;
  }

  isPositive(){
    return this.has( PARTICIPANT_TYPE.POSITIVE );
  }

  isNegative(){
    return this.has( PARTICIPANT_TYPE.NEGATIVE );
  }

  isSigned(){
    return this.isPositive() || this.isNegative();
  }

  areParticipantsTyped(){
    return true;
  }

  setParticipantAs( ppt, type ){
    let intn = this.interaction;
    let signedPpts = intn.participantsNotOfType( PARTICIPANT_TYPE.UNSIGNED );
    let makeUnsigned = ppt => intn.retypeParticipant( ppt, PARTICIPANT_TYPE.UNSIGNED );

    return Promise.all([
      intn.retypeParticipant( ppt, type ),
      signedPpts.map( makeUnsigned )
    ]);
  }

  setPariticpantAsPositive( ppt ){
    return this.setParticipantAs( ppt, PARTICIPANT_TYPE.POSITIVE );
  }

  setParticipantAsNegative( ppt ){
    return this.setParticipantAs( ppt, PARTICIPANT_TYPE.NEGATIVE );
  }

  getTarget(){
    let intn = this.interaction;

    if( !intn.completed() ){
      throw error(`Can not get target of incomplete interaction ${intn.id()}`);
    }

    let ppts = intn.participantsNotOfType( PARTICIPANT_TYPE.UNSIGNED );

    if( ppts.length > 1 ){ // can't have more than one target
      throw error(`Can not get target, as more than two participants of interaction ${intn.id()} are signed: ` + intn.participants().map( ppt => ppt.id() ).join(', '));
    }

    return ppts[0];
  }

  getSource(){
    let intn = this.interaction;

    if( !intn.completed() ){
      throw error(`Can not get source of incomplete interaction ${intn.id()}`);
    }

    let ppts = intn.participantsOfType( PARTICIPANT_TYPE.UNSIGNED );

    if( ppts.length > 1 ){ // can't have more than one source
      throw error(`Can not get source, as more than two participants of interaction ${intn.id()} are unsigned: ` + intn.participants().map( ppt => ppt.id() ).join(', '));
    }

    return ppts[0];
  }

  toString(expr = 'interacts with'){
    let intn = this.interaction;
    let src, tgt;

    try {
      src = this.getSource();
      tgt = this.getTarget();
    } catch( err ){
      let ppts = intn.participants();

      src = ppts[0];
      tgt = ppts[1];
    }

    let srcName = src.name() || '(?)';
    let tgtName = tgt.name() || '(?)';

    return `${srcName} ${expr} ${tgtName}`;
  }

  static isAllowedForInteraction( intn ){ // eslint-disable-line no-unused-vars
    return true;
  }

  static get value(){ return VALUE; }
  get value(){ return VALUE; }

  static get displayValue(){ return DISPLAY_VALUE; }
  get displayValue(){ return DISPLAY_VALUE; }
}

module.exports = InteractionType;
