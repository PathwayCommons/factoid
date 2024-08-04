const COLLECTIONS = Object.freeze({
    PUBMED: {
        dbname: 'PubMed',
        dbPrefix: 'pubmed'
    },
    /** 
     * The Taxonomy Database is a curated classification and nomenclature for all of the organisms 
     * in the public sequence databases. This currently represents about 10% of the described species of life on the planet.
    */
    NCBI_TAXONOMY: { 
        dbname: 'NCBI Taxonomy',
        dbPrefix: 'NCBITaxon'
    }
});

export { COLLECTIONS };

