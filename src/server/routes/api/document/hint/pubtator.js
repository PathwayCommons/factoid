import _ from 'lodash';
import fetch from 'node-fetch';
import queryString from 'query-string';

import logger from '../../../../logger.js';
import {
  Hint,
  HINT_TYPE
} from '../../../../../model/hint.js';
 import {
  NCBI_BASE_URL
 } from '../../../../../config.js';
import { checkHTTPStatus } from '../../../../../util/fetch.js';

/**
 * Map a PubTator BioCDocument to a hint
 * @param {object} bioCDocument as defined by [NLM DTD]{@link ftp://ftp.ncbi.nlm.nih.gov/pub/wilbur/BioC-PMC/BioC.dtd}
 * @returns {Array.<Hint>} hints a set of hints
 */
function map ( bioCDocument ) {
  let hints = [];

  // Annotation types defined within tmVar 3.0 concept recognition tool
  // doi:10.1093/bioinformatics/btac537
  const PUBTATOR_ANNOTATION_TYPE = Object.freeze({
    GENE: 'Gene',
    SPECIES: 'Species',
    CHEMICAL: 'Chemical',
    DISEASE: 'Disease',
    CELL_LINE: 'CellLine',
    // DNA_MUTATION: 'DNAMutation',
    // PROTEIN_MUTATION: 'ProteinMutation',
    // SNP: 'SNP',
    // DNA_ALLELE: 'DNAAllele',
    // PROTEIN_ALLELE: 'ProteinAllele',
    // ACID_CHANGE: 'AcidChange',
    // OTHER_MUTATION: 'OtherMutation'
  });
  const entityTypes = new Map([
    [PUBTATOR_ANNOTATION_TYPE.GENE, HINT_TYPE.GGP ],
    [PUBTATOR_ANNOTATION_TYPE.CHEMICAL, HINT_TYPE.CHEMICAL ],
    [PUBTATOR_ANNOTATION_TYPE.DISEASE, HINT_TYPE.DISEASE ],
    [PUBTATOR_ANNOTATION_TYPE.CELL_LINE, HINT_TYPE.CELL_LINE ],
    [PUBTATOR_ANNOTATION_TYPE.SPECIES, HINT_TYPE.ORGANISM ]
  ]);
  const dbPrefixes = new Map([
    [PUBTATOR_ANNOTATION_TYPE.GENE, 'NCBIGene'],
    [PUBTATOR_ANNOTATION_TYPE.CHEMICAL, 'CHEBI'],
    [PUBTATOR_ANNOTATION_TYPE.DISEASE, 'mesh'],
    [PUBTATOR_ANNOTATION_TYPE.CELL_LINE, 'cellosaurus'],
    [PUBTATOR_ANNOTATION_TYPE.SPECIES, 'taxonomy'],
  ]);
   const dbNames = new Map([
    [PUBTATOR_ANNOTATION_TYPE.GENE, 'NCBI Gene'],
    [PUBTATOR_ANNOTATION_TYPE.CHEMICAL, 'ChEBI'],
    [PUBTATOR_ANNOTATION_TYPE.DISEASE, 'MeSH'],
    [PUBTATOR_ANNOTATION_TYPE.CELL_LINE, 'Cellosaurus'],
    [PUBTATOR_ANNOTATION_TYPE.SPECIES, 'NCBI Taxonomy'],
  ]);

  const byText = annotation => {
    // Could do some processing here (dashes etc)
    const sanitized = text => text.toLowerCase();
    const { text } = annotation;
    return sanitized( text );
  };

  const isValid = annotation => {
    const isValidType = annotation => {
      const { infons: { type }} = annotation;
      return _.includes( PUBTATOR_ANNOTATION_TYPE, type );
    };
    const hasXref = annotation => {
      const { infons } = annotation;
      return _.has( infons, 'identifier' );
    };
    return isValidType( annotation ) && hasXref( annotation );
  };

  const toHint = ( annotation, section ) => {
    const { text, infons: { identifier: id, type } } = annotation;

    const hint = new Hint();
    hint.text = text;
    hint.type = entityTypes.get( type );
    hint.xref = {
      dbName: dbNames.get( type ),
      dbPrefix: dbPrefixes.get( type ),
      id
    };
    hint.section = section;
    return hint;
  };

  let { passages } = bioCDocument;

  for( const passage of passages ){
    let { annotations } = passage;
    const section = passage.infons.type;
    // Allow varying text for a given xref
    annotations = _.uniqBy( annotations, byText );
    annotations = _.filter( annotations, isValid );
    annotations.forEach( a => {
      const hint = toHint( a, section );
      hints.push( hint );
    });
  }
  return hints;
}

const BIOC_FORMAT = Object.freeze({
  BIOCXML: 'biocxml',
  PUBTATOR: 'pubtator',
  BIOCJSON: 'biocjson'
});

/**
 * Get a BioCDocument from PubTator
 * @param {string} pmid A PubMed uid
 * @param {string} format One of the BIOC_FORMATs
 * @returns {object} A BioC Document
 */
async function get ( pmids, format = BIOC_FORMAT.BIOCJSON ) {
  const PUBTATOR_API_PATH = 'research/pubtator3-api/publications/export/';
  const params = queryString.stringify({ pmids });
  const url = `${NCBI_BASE_URL}${PUBTATOR_API_PATH}${format}?${params}`;

  try {
    let response = await fetch( url );
    response = checkHTTPStatus( response ); // HTTPStatusError
    const text = await response.text();
    const data = text ? JSON.parse( text ) : null; // Optional body
    return data;

  } catch (e) {
    logger.error( `Error in pubtator::get with ${pmids}` );
    logger.error( e );
    throw e;
  }
}

const pubtator = {
  map,
  get
};

export default pubtator;