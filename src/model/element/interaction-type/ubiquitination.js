const Modification = require('./modification');

const VALUE = 'ubiquitination';
const DISPLAY_VALUE = 'Ubiquitination';
const EFFECT = 'ubiquitinated';

class Ubiquitination extends Modification {
  constructor( intn ){
    super( intn );
  }

  toBiopaxTemplate(){
    // TODO BIOPAX
    return super.toBiopaxTemplate(EFFECT);
  }

  toString(){
    return super.toString(VALUE);
  }

  static get value(){ return VALUE; }
  get value(){ return VALUE; }

  static get displayValue(){ return DISPLAY_VALUE; }
  get displayValue(){ return DISPLAY_VALUE; }
}

module.exports = Ubiquitination;
