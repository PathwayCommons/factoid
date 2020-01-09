import _ from 'lodash';

import Interaction from './interaction';
import Binding from './binding';
import TranscriptionTranslation from './transcription-translation';
import Modification from './modification';
import Phosphorylation from './phosphorylation';
import Dephosphorylation from './dephosphorylation';
import Methylation from './methylation';
import Demethylation from './demethylation';
import Ubiquitination from './ubiquitination';
import Deubiquitination from './deubiquitination';

const INTERACTION_TYPE = Object.freeze({
  BINDING: Binding,
  TRANSCRIPTION_TRANSLATION: TranscriptionTranslation,
  MODIFICATION: Modification,
  PHOSPHORYLATION: Phosphorylation,
  DEPHOSPHORYLATION: Dephosphorylation,
  METHYLATION: Methylation,
  DEMETHYLATION: Demethylation,
  UBIQUITINATION: Ubiquitination,
  DEUBIQUITINATION: Deubiquitination,
  INTERACTION: Interaction // other / catch-all
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

export { INTERACTION_TYPE, INTERACTION_TYPES, getIntnTypeByVal, INTERACTION_TYPE_VALS };
