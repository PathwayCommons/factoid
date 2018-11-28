const _ = require('lodash');

const pptType = ( value, displayValue, icon, verb ) => Object.freeze({ value, displayValue, icon, verb });

const PARTICIPANT_TYPE = Object.freeze({
  //target cannot be UNSIGNED but can be UNSIGNED_TARGET (special value)
  UNSIGNED: pptType('unsigned', '–',
    '<i class="material-icons">remove</i>', 'interacts with'),
  // unsigned target only indicates the target of an interaction; not meant for ui display
  UNSIGNED_TARGET: pptType('unsigned target', '–',
    '<i class="material-icons">remove</i>', 'affects'),
  POSITIVE: pptType('positive', '→',
    '<i class="material-icons">arrow_forward</i>', 'positively affects'),
  NEGATIVE: pptType('negative', '⊣',
    '<i class="material-icons icon-rot-90">title</i>', 'negatively affects')
});

//pptType objects array
const PARTICIPANT_TYPES = _.keys( PARTICIPANT_TYPE ).map( k => PARTICIPANT_TYPE[k] );

//finds a pptType by value (e.g., 'positive')
const getPptTypeByVal = val => {
  return PARTICIPANT_TYPES.find( type => type.value === val ) || PARTICIPANT_TYPE.UNSIGNED;
};

module.exports = { PARTICIPANT_TYPE, PARTICIPANT_TYPES, getPptTypeByVal };
