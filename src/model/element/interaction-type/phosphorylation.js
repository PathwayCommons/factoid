import Modification from './modification';

const VALUE = 'phosphorylation';
const DISPLAY_VALUE = 'Phosphorylation';
const EFFECT = 'phosphorylated';

class Phosphorylation extends Modification {
  constructor( intn ){
    super( intn );
  }

  toBiopaxTemplate( transform ){
    return super.toBiopaxTemplate(transform, EFFECT);
  }

  toString(){
    return super.toString('phosphorylation');
  }

  static get value(){ return VALUE; }
  get value(){ return VALUE; }

  static get displayValue(){ return DISPLAY_VALUE; }
  get displayValue(){ return DISPLAY_VALUE; }
}

export default Phosphorylation;
