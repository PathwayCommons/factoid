import _ from 'lodash';

const ENTITY_TYPE = Object.freeze({
  ENTITY: 'entity',
  GGP: 'ggp', // gene or gene product
  DNA: 'dna',
  RNA: 'rna',
  PROTEIN: 'protein',
  CHEMICAL: 'chemical',
  COMPLEX: 'complex',
  NAMED_COMPLEX: 'namedComplex'
});

const NCBI_GENE_TYPE = Object.freeze({
  GGP: ['unknown', 'biological-region', 'other'],
  RNA: ['tRNA', 'rRNA', 'snRNA', 'scRNA', 'snoRNA', 'miscRNA', 'ncRNA'],
  DNA: ['pseudo', 'transposon'],
  PROTEIN: ['protein-coding']
});

const getNCBIEntityType = typeOfGene => {
  let keys = Object.keys( NCBI_GENE_TYPE );
  let res = null;

  for ( let i = 0; i < keys.length; i++ ) {
    let key = keys[i];
    if ( _.includes( NCBI_GENE_TYPE[ key ], typeOfGene ) ) {
      res = ENTITY_TYPE[ key ];
      break;
    }
  }

  return res;
};

const ENTITY_TYPES = _.flatMap( ENTITY_TYPE );

export { ENTITY_TYPE, ENTITY_TYPES, getNCBIEntityType };
