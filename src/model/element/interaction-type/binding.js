import InteractionType from './interaction-type';
import { PARTICIPANT_TYPE } from '../participant-type';
import { BIOPAX_TEMPLATE_TYPE } from './biopax-type';
import _ from 'lodash';

const VALUE = 'binding';
const DISPLAY_VALUE = 'Binding';

const allowedParticipantTypes = () => {
  const T = PARTICIPANT_TYPE;

  return [ T.UNSIGNED ];
};

class Binding extends InteractionType {
  constructor( intn ){
    super( intn );
  }

  isComplete() {
    return !this.isSigned() && Binding.isAllowedForInteraction(this.interaction);
  }

  static allowedParticipantTypes(){
    return allowedParticipantTypes();
  }

  allowedParticipantTypes(){
    return allowedParticipantTypes();
  }

  static isAllowedForInteraction( intn ){
    // TODO: is complex okay?
    let ppts = intn.participants();
    return ppts.length === 2;
  }

  toBiopaxTemplate( transform ){
    if ( !this.validatePpts() ){
      return this.makeInvalidBiopaxTemplate();
    }

    let participants = _.uniqBy(this.interaction.participants().map( transform ), p => p.id() );

    // if only one participant is remained after the transformation skip the interaction
    if ( participants.length == 1 ) {
      return null;
    }

    let participantTemplates = participants.map( participant => participant.toBiopaxTemplate() );

    return {
      type: BIOPAX_TEMPLATE_TYPE.MOLECULAR_INTERACTION,
      participants: participantTemplates
    };
  }

  toString(){
    if( this.isNegative() || this.isPositive() ){
      return super.toString(null, 'via binding');
    } else {
      return super.toString('binds with');
    }
  }

  static get value(){ return VALUE; }
  get value(){ return VALUE; }

  static get displayValue(){ return DISPLAY_VALUE; }
  get displayValue(){ return DISPLAY_VALUE; }
}

export default Binding;
