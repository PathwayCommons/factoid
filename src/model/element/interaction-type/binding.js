import InteractionType from './interaction-type';
import { PARTICIPANT_TYPE } from '../participant-type';
import { ENTITY_TYPE } from '../entity-type';
import { BIOPAX_TEMPLATE_TYPE } from './biopax-type';

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
    let ppts = intn.participants();
    let isProtein = ent => ent.type() === ENTITY_TYPE.PROTEIN;

    return ppts.length === 2 && ppts.every( isProtein );
  }

  toBiopaxTemplate(){
    if ( !this.validatePpts() ){
      return this.makeInvalidBiopaxTemplate();
    }

    let participants = this.interaction.participants();
    let participantTemplates = participants.map( participant => participant.toBiopaxTemplate() );

    return {
      type: BIOPAX_TEMPLATE_TYPE.MOLECULAR_INTERACTION,
      participants: participantTemplates
    };
  }

  toString(){
    return super.toString('binds with');
  }

  static get value(){ return VALUE; }
  get value(){ return VALUE; }

  static get displayValue(){ return DISPLAY_VALUE; }
  get displayValue(){ return DISPLAY_VALUE; }
}

export default Binding;
