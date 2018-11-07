const _ = require('lodash');

const Interaction = require('./interaction');
const Binding = require('./binding');
const TranscriptionTranslation = require('./transcription-translation');
const Modification = require('./modification');
const Phosphorylation = require('./phosphorylation');
const Dephosphorylation = require('./dephosphorylation');
const Methylation = require('./methylation');
const Demethylation = require('./demethylation');
const Ubiquination = require('./ubiquination');
const Deubiquination = require('./deubiquination');

const INTERACTION_TYPE = Object.freeze({
  BINDING: Binding,
  TRANSCRIPTION_TRANSLATION: TranscriptionTranslation,
  MODIFICATION: Modification,
  PHOSPHORYLATION: Phosphorylation,
  DEPHOSPHORYLATION: Dephosphorylation,
  METHYLATION: Methylation,
  DEMETHYLATION: Demethylation,
  UBIQUINATION: Ubiquination,
  DEUBIQUINATION: Deubiquination,
  INTERACTION: Interaction
});

const INTERACTION_TYPE_VALS = ( () => {
  let keys = _.keys( INTERACTION_TYPE );
  let vals = {};

  keys.forEach( key => {
    let val = INTERACTION_TYPE[key].value;

    vals[ key ] = val;
  } );

  return vals;
} )();

const INTERACTION_TYPES = _.keys( INTERACTION_TYPE ).map( k => INTERACTION_TYPE[k] );

const getIntnTypeByVal = val => {
  return INTERACTION_TYPES.find( type => type.value === val ) || INTERACTION_TYPE.GENERAL;
};

module.exports = { INTERACTION_TYPE, INTERACTION_TYPES, getIntnTypeByVal, INTERACTION_TYPE_VALS };
