import _ from 'lodash';

const ENTITY_TYPE = Object.freeze({
  ENTITY: 'entity',
  GGP: 'ggp', // gene or gene product
  DNA: 'dna',
  RNA: 'rna',
  PROTEIN: 'protein',
  CHEMICAL: 'chemical',
  COMPLEX: 'complex'
});

const ENTITY_TYPES = _.flatMap( ENTITY_TYPE );

export { ENTITY_TYPE, ENTITY_TYPES };
