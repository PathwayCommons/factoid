const _ = require('lodash');

const ENTITY_TYPE = Object.freeze({
  ENTITY: 'entity',
  PROTEIN: 'protein',
  CHEMICAL: 'chemical'
});

const ENTITY_TYPES = _.flatMap( ENTITY_TYPE );

module.exports = { ENTITY_TYPE, ENTITY_TYPES };
