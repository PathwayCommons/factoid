import InteractionType from './interaction-type';
import { BIOPAX_TEMPLATE_TYPE, BIOPAX_CONTROL_TYPE } from './biopax-type';
import _ from 'lodash';

const VALUE = 'interaction';
const DISPLAY_VALUE = 'Other';

class Interaction extends InteractionType {

  constructor( intn ){
    super( intn );
  }

  static isAllowedForInteraction( intn ){
    return intn.participants().length === 2;
  }

  isComplete() {
    return Interaction.isAllowedForInteraction(this.interaction);
  }

  toBiopaxTemplate( transform ){
    if ( !this.validatePpts( transform ) ){
      return this.makeInvalidBiopaxTemplate();
    }

    // "Other" type; see 4A-E in "Factoid binary interaction types" doc.
    let template = {
      type: BIOPAX_TEMPLATE_TYPE.OTHER_INTERACTION
    };

    //optional controlType
    if(this.isNegative())
      template.controlType = BIOPAX_CONTROL_TYPE.INHIBITION;
    else if(this.isPositive())
      template.controlType = BIOPAX_CONTROL_TYPE.ACTIVATION;

    //optional source, target are either both null or both defined (unless there is a bug)
    let source = this.getSource();
    let target = this.getTarget();
    //ensure participants order is always [source,target] if defined
    let participants = (source && target) ? [source, target] : this.interaction.participants();
    participants = _.uniqBy( participants.map( transform ), p => p.id() );

    // if only one participant is remained after the transformation skip the interaction
    if ( participants.length == 1 ) {
      return;
    }

    template.participants = participants.map( participant => participant.toBiopaxTemplate() );

    return template;
  }

  static get value(){ return VALUE; }
  get value(){ return VALUE; }

  static get displayValue(){ return DISPLAY_VALUE; }
  get displayValue(){ return DISPLAY_VALUE; }
}

export default Interaction;
