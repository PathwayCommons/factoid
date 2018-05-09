const Modification = require('./modification');

const VALUE = 'methylation';
const DISPLAY_VALUE = 'Methylation';

class Methylation extends Modification {
  constructor( intn ){
    super( intn );
  }

  toString(){
    return super.toString(VALUE);
  }

  static get value(){ return VALUE; }
  get value(){ return VALUE; }

  static get displayValue(){ return DISPLAY_VALUE; }
  get displayValue(){ return DISPLAY_VALUE; }
}

module.exports = Methylation;
