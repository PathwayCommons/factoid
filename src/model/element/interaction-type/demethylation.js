import Modification from './modification';

const VALUE = 'demethylation';
const DISPLAY_VALUE = 'Demethylation';
const EFFECT = 'demethylated';

class Demethylation extends Modification {
  constructor( intn ){
    super( intn );
  }

  toBiopaxTemplate(transform, omitDbXref){
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

export default Demethylation;
