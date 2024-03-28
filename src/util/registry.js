const COLLECTIONS = Object.freeze({
  PUBMED: {
    dbName: 'PubMed',
    dbPrefix: 'pubmed'
  },
  NCBI_GENE: {
    dbName: 'NCBI Gene',
    dbPrefix: 'NCBIGene'
  },
  MESH: {
    dbName: 'MeSH',
    dbPrefix: 'mesh'
  },
  CHEBI: {
    dbName: 'ChEBI',
    dbPrefix: 'CHEBI'
  },
  NCBI_TAXONOMY: {
    dbName: 'NCBI Taxonomy',
    dbPrefix: 'NCBITaxon'
  },
  CELLOSAURUS: {
    dbName: 'CELLOSAURUS',
    dbPrefix: 'cellosaurus'
  },
  UNIPROT: {
    dbName: 'UniProt Knowledgebase',
    dbPrefix: 'uniprot'
  }
});

export { COLLECTIONS };