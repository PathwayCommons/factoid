const { INTERACTION_TYPE_VALS } = require('./interaction-type/enum');

const ELEMENT_TYPE = Object.assign({}, {
  ENTITY: 'entity',
  PROTEIN: 'protein',
  CHEMICAL: 'chemical'
}, INTERACTION_TYPE_VALS);

const ELEMENT_TYPES = Object.keys( ELEMENT_TYPE ).map( k => ELEMENT_TYPE[k] );

const isEntity = type => {
  switch( type ){
    case ELEMENT_TYPE.ENTITY:
    case ELEMENT_TYPE.PROTEIN:
    case ELEMENT_TYPE.CHEMICAL:
      return true;
    default:
      return false;
  }
};

const isInteraction = type => {
  const T = INTERACTION_TYPE_VALS;

  switch( type ){
    case T.INTERACTION:
    case T.CHEMICAL_AFFECTS_PROTEIN:
    case T.EXPRESSION:
    case T.MODIFICATION:
    case T.PROTEIN_AFFECTS_CHEMICAL:
      return true;
    default:
      return false;
  }
};

module.exports = { ELEMENT_TYPE, ELEMENT_TYPES, isEntity, isInteraction };
