const Modification = require('./modification');

const VALUE = 'phosphorylation';
const DISPLAY_VALUE = 'Phosphorylation';

class Phosphorylation extends Modification {
  constructor( intn ){
    super( intn );
  }

  toString(){
    return super.toString('phosphorylation');
  }

  static get value(){ return VALUE; }
  get value(){ return VALUE; }

  static get displayValue(){ return DISPLAY_VALUE; }
  get displayValue(){ return DISPLAY_VALUE; }
}

module.exports = Phosphorylation;
