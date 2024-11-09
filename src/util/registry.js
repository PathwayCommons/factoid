const COLLECTIONS = Object.freeze({
  PUBMED: {
    dbname: 'PubMed',
    dbPrefix: 'pubmed',
  },
  NCBI_GENE: {
    dbName: 'NCBI Gene',
    dbPrefix: 'NCBIGene',
  },
  /**
   * The Taxonomy Database is a curated classification and nomenclature for all of the organisms
   * in the public sequence databases. This currently represents about 10% of the described species of life on the planet.
   */
  NCBI_TAXONOMY: {
    dbname: 'NCBI Taxonomy',
    dbPrefix: 'NCBITaxon',
  },
  MESH: {
    dbName: 'MeSH',
    dbPrefix: 'mesh',
  },
  CHEBI: {
    dbName: 'ChEBI',
    dbPrefix: 'CHEBI',
  },
  CELLOSAURUS: {
    dbName: 'CELLOSAURUS',
    dbPrefix: 'cellosaurus',
  },
  UNIPROT: {
    dbName: 'UniProt Knowledgebase',
    dbPrefix: 'uniprot',
  },
});

export { COLLECTIONS };
