import Modification from './modification';

const VALUE = 'methylation';
const DISPLAY_VALUE = 'Methylation';
const EFFECT = 'methylated';

class Methylation extends Modification {
  constructor( intn ){
    super( intn );
  }

  toBiopaxTemplate( transform, omitDbXref ){
    return super.toBiopaxTemplate(transform, omitDbXref, EFFECT);
  }

  toString(){
    return super.toString(VALUE);
  }

  static get value(){ return VALUE; }
  get value(){ return VALUE; }

  static get displayValue(){ return DISPLAY_VALUE; }
  get displayValue(){ return DISPLAY_VALUE; }
}

export default Methylation;
