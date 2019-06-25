import _ from 'lodash';

const ENTITY_TYPE = Object.freeze({
  ENTITY: 'entity',
  PROTEIN: 'protein',
  CHEMICAL: 'chemical',
  COMPLEX: 'complex'
});

const ENTITY_TYPES = _.flatMap( ENTITY_TYPE );

export { ENTITY_TYPE, ENTITY_TYPES };
