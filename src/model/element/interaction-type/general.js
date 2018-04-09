const InteractionType = require('./interaction-type');

const VALUE = 'interaction';
const DISPLAY_VALUE = 'General';

class General extends InteractionType {
  constructor( intn ){
    super( intn );
  }

  static get value(){ return VALUE; }
  get value(){ return VALUE; }

  static get displayValue(){ return DISPLAY_VALUE; }
  get displayValue(){ return DISPLAY_VALUE; }
}

module.exports = General;
