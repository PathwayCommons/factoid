const _ = require('lodash');

const General = require('./general');
const ChemicalAffectsProtein = require('./chemical-affects-protein');
const Expression = require('./expression');
const Modification = require('./modification');
const ProteinAffectsChemical = require('./protein-affects-chemical');

const INTERACTION_TYPE = Object.freeze({
  INTERACTION: General,
  CHEMICAL_AFFECTS_PROTEIN: ChemicalAffectsProtein,
  EXPRESSION: Expression,
  MODIFICATION: Modification,
  PROTEIN_AFFECTS_CHEMICAL: ProteinAffectsChemical
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
