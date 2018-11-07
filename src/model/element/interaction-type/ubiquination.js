const Modification = require('./modification');

const VALUE = 'ubiquination';
const DISPLAY_VALUE = 'Ubiquination';
const EFFECT = 'ubiquinated';

class Ubiquination extends Modification {
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

module.exports = Ubiquination;
