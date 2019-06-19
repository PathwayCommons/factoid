import _ from 'lodash';

const pptType = ( value, displayValue, icon, verbPhrase ) => Object.freeze({ value, displayValue, icon, verbPhrase });

const PARTICIPANT_TYPE = Object.freeze({
  UNSIGNED: pptType('unsigned', 'unsigned', 'icon icon-arrow-unsigned', 'interacts with'),
  POSITIVE: pptType('positive', 'positive', 'icon icon-arrow-positive', 'activates'),
  NEGATIVE: pptType('negative', 'negative', 'icon icon-arrow-negative', 'inhibits')
});

//pptType objects array
const PARTICIPANT_TYPES = _.keys( PARTICIPANT_TYPE ).map( k => PARTICIPANT_TYPE[k] );

//finds a pptType by value (e.g., 'positive')
const getPptTypeByVal = val => {
  return PARTICIPANT_TYPES.find( type => type.value === val ) || PARTICIPANT_TYPE.UNSIGNED;
};

export { PARTICIPANT_TYPE, PARTICIPANT_TYPES, getPptTypeByVal };
