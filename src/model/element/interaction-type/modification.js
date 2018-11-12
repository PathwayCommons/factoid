const InteractionType = require('./interaction-type');
const { PARTICIPANT_TYPE } = require('../participant-type');
const { ENTITY_TYPE } = require('../entity-type');
const { BIOPAX_TEMPLATE_TYPE, BIOPAX_CONTROL_TYPE } = require('./biopax-type');

const VALUE = 'modification';
const DISPLAY_VALUE = 'Modification/activity change';

class Modification extends InteractionType {
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
    let isProtein = ent => ent.type() === ENTITY_TYPE.PROTEIN;

    return ppts.length === 2 && ppts.every( isProtein );
  }

  toBiopaxTemplate(effect){ //effect is undefined in base Modification case (i.e., no phys. mod. feature)
    let source = this.getSource();
    let target = this.getTarget();

    let srcTemplate = source.toBiopaxTemplate();
    let tgtTemplate = target.toBiopaxTemplate();

    let controlType = this.isInhibition()
      ? BIOPAX_CONTROL_TYPE.INHIBITION
      : BIOPAX_CONTROL_TYPE.ACTIVATION;

    let template = {
      type: BIOPAX_TEMPLATE_TYPE.PROTEIN_CONTROLS_STATE,
      controller: srcTemplate, //controller protein
      target: tgtTemplate,
      controlType: controlType
      //here controlType is not bp:controlType but is about whether
      //target's state switches from 'inactive' to 'active' or the other way around.
    };

    if (effect) {
      template.modification = effect;
    }

    return template;
  }

  toString( mod = 'modification' ){
    return super.toString(null, `via ${mod}`);
  }

  static get value(){ return VALUE; }
  get value(){ return VALUE; }

  static get displayValue(){ return DISPLAY_VALUE; }
  get displayValue(){ return DISPLAY_VALUE; }
}

module.exports = Modification;
