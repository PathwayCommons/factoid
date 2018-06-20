const InteractionType = require('./interaction-type');
const { PARTICIPANT_TYPE } = require('../participant-type');
const { BIOPAX_TEMPLATE_TYPE, BIOPAX_CONTROL_TYPE } = require('./biopax-type');

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

  toBiopaxTemplate(){
    let negative = this.isNegative();
    let source = this.getSource();
    let target = this.getTarget();
    let srcTemplate = source.toBiopaxTemplate();
    let tgtTemplate = target.toBiopaxTemplate();

    let template;

    if( target.type() === 'chemical' ){
      let type = negative ? BIOPAX_TEMPLATE_TYPE.PROTEIN_CONTROLS_CONSUMPTION : BIOPAX_TEMPLATE_TYPE.PROTEIN_CONTROLS_PRODUCTION;

      template = {
        type: type,
        controllerProtein: srcTemplate,
        chemical: tgtTemplate
      };
    }
    else {
      let type = BIOPAX_TEMPLATE_TYPE.CHEMICAL_AFFECTS_STATE;
      let controlType = negative ? BIOPAX_CONTROL_TYPE.INHIBITION : BIOPAX_CONTROL_TYPE.ACTIVATION;

      template = {
        type: type,
        chemical: srcTemplate,
        targetProtein: tgtTemplate,
        controlType: controlType
      };
    }

    return template;
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
