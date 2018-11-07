const Modification = require('./modification');

const VALUE = 'dephosphorylation';
const DISPLAY_VALUE = 'Dephosphorylation';
const EFFECT = 'dephosphorylated';

class Dephosphorylation extends Modification {
  constructor( intn ){
    super( intn );
  }

  toBiopaxTemplate(){
    // TODO BIOPAX
    return super.toBiopaxTemplate(EFFECT);
  }

  toString(){
    return super.toString('dephosphorylation');
  }

  static get value(){ return VALUE; }
  get value(){ return VALUE; }

  static get displayValue(){ return DISPLAY_VALUE; }
  get displayValue(){ return DISPLAY_VALUE; }
}

module.exports = Dephosphorylation;
