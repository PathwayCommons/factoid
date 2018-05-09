const _ = require('lodash');

const pptType = ( value, displayValue, icon ) => Object.freeze({ value, displayValue, icon });

const PARTICIPANT_TYPE = Object.freeze({
  UNSIGNED: pptType('unsigned', '–', '<i class="material-icons">remove</i>'),
  // unsigned target only indicates the target of an interaction; not meant for ui display
  UNSIGNED_TARGET: pptType('unsigned target', '–', '<i class="material-icons">remove</i>'),
  POSITIVE: pptType('positive', '→', '<i class="material-icons">arrow_forward</i>'),
  NEGATIVE: pptType('negative', '⊣', '<i class="material-icons icon-rot-90">title</i>')
});

const PARTICIPANT_TYPES = _.keys( PARTICIPANT_TYPE ).map( k => PARTICIPANT_TYPE[k] );

const getPptTypeByVal = val => {
  return PARTICIPANT_TYPES.find( type => type.value === val ) || PARTICIPANT_TYPE.UNSIGNED;
};

module.exports = { PARTICIPANT_TYPE, PARTICIPANT_TYPES, getPptTypeByVal };
