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
import { COLLECTIONS } from '../../../../../util/registry.js';

/**
 * Map a PubTator BioCDocument to a hint
 * @param {object} bioCDocument as defined by [NLM DTD]{@link ftp://ftp.ncbi.nlm.nih.gov/pub/wilbur/BioC-PMC/BioC.dtd}
 * @returns {Array.<Hint>} hints a set of hints
 */
function map ( bioCDocument ) {
  let hints = [];

  // See Table 1 https://www.ncbi.nlm.nih.gov/research/pubtator3/tutorial
  const PUBTATOR_ANNOTATION_TYPE = Object.freeze({
    GENE: 'Gene',
    SPECIES: 'Species',
    CHEMICAL: 'Chemical',
    DISEASE: 'Disease',
    CELL_LINE: 'CellLine'
    // VARIANT: 'Variant'
  });
  const PUBTATOR_DATABASE = Object.freeze({
    ncbi_gene: 'ncbi_gene',
    ncbi_taxonomy: 'ncbi_taxonomy',
    ncbi_mesh: 'ncbi_mesh',
    cvcl: 'cvcl',
    litvar: 'litvar'
  });
  const entityTypes = new Map([
    [PUBTATOR_ANNOTATION_TYPE.GENE, HINT_TYPE.GGP ],
    [PUBTATOR_ANNOTATION_TYPE.CHEMICAL, HINT_TYPE.CHEMICAL ],
    [PUBTATOR_ANNOTATION_TYPE.DISEASE, HINT_TYPE.DISEASE ],
    [PUBTATOR_ANNOTATION_TYPE.CELL_LINE, HINT_TYPE.CELL_LINE ],
    [PUBTATOR_ANNOTATION_TYPE.SPECIES, HINT_TYPE.ORGANISM ]
  ]);
  const database2Xref = new Map([
    [ PUBTATOR_DATABASE.ncbi_gene, COLLECTIONS.NCBI_GENE ],
    [ PUBTATOR_DATABASE.ncbi_mesh, COLLECTIONS.MESH ],
    [ PUBTATOR_DATABASE.cvcl, COLLECTIONS.CELLOSAURUS ],
    [ PUBTATOR_DATABASE.ncbi_taxonomy, COLLECTIONS.NCBI_TAXONOMY ]
  ]);

  // const byText = annotation => {
  //   // Could do some processing here (dashes etc)
  //   const sanitized = text => text.toLowerCase();
  //   const { text } = annotation;
  //   return sanitized( text );
  // };

  const groupByXref = annotations => {
    const byXref = ({ infons }) => `${infons.database}_${infons.identifier}`;
    let groups = _.groupBy( annotations, byXref );
    groups = Object.values( groups ).map( group => {
      const texts = group.map( a => a.text );
      const first = _.first( group );
      const core = _.pick( first, [ 'infons' ]);
      return _.assign( core, { texts } );
    });
    return groups;
  };

  const isValidType = annotation => {
    const { infons: { type }} = annotation;
    return _.includes( PUBTATOR_ANNOTATION_TYPE, type );
  };

  const isValidXref = annotation => {
    const EMPTY_SYMBOLS = new Set(['-', '']);
    let isValid = false;
    const hasId = a => _.has( a, [ 'infons', 'identifier' ] );
    const isNil = a => {
      const id = _.get( a, [ 'infons', 'identifier' ] );
      return  _.isNil( id );
    };
    const isEmpty = a => {
      const id = _.get( a, [ 'infons', 'identifier' ] );
      return EMPTY_SYMBOLS.has( id );
    };
    if( hasId( annotation )
        && !isNil( annotation )
        && !isEmpty( annotation ) ){
      isValid = true;
    }
    return isValid;
  };

  const toHint = ( annotation, section ) => {
    const { texts, infons: { identifier: id, database, type } } = annotation;
    const xref = _.assign( { id }, database2Xref.get( database ) );
    const eType = entityTypes.get( type );

    const hint = new Hint( texts, eType, xref, section );
    return hint;
  };

  let { passages } = bioCDocument;

  for( const passage of passages ){
    let { annotations } = passage;
    const section = passage.infons.type;
    annotations = _.filter( annotations, isValidType );
    annotations = _.filter( annotations, isValidXref );
    annotations = groupByXref( annotations );
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
 * Technically, PubTator3 API accepts a comma-delimited list of PMIDs, but the response poses
 * several format (not pure JSON) and mapping issues (e.g. missing responses ) so don't do this.
 *
 * @param {string} pmids A PubMed uid
 * @param {string} format One of the BIOC_FORMATs
 * @returns {object} A BioC Document
 */
async function get ( pmids, format = BIOC_FORMAT.BIOCJSON ) {
  const toJson = async response => {
    let data = null;
    const text = await response.text();
    if ( text ){ // Optional body
      data = JSON.parse( text );
    }
    return data;
  };
  const PUBTATOR_API_PATH = 'research/pubtator3-api/publications/export/';
  const params = queryString.stringify({ pmids });
  const url = `${NCBI_BASE_URL}${PUBTATOR_API_PATH}${format}?${params}`;

  try {
    let response = await fetch( url );
    response = checkHTTPStatus( response ); // HTTPStatusError
    return toJson( response );
  } catch (e) {
    logger.error( `Error in pubtator::get with ${pmids}` );
    logger.error( e );
    throw e;
  }
}

/**
 * A simple wrapper to retrieve Hints from PubTator
 * @param {Object} publicationXref - An identifier for a paper
 * @param {string} publicationXref.id - The local identifier value
 * @param {string} publicationXref.dbPrefix - The database prefix
 * @returns {Array<Hint>} A list of Hint instances or null
 */
async function hints({ id, dbPrefix }) {
  let hints = null;
  if ( dbPrefix === COLLECTIONS.PUBMED.dbPrefix ) {
    const pmid = id;
    const bioCDocument = await get( pmid );
    if( bioCDocument != null ) hints = map( bioCDocument );
  }
  return hints;
}

const pubtator = {
  map,
  get,
  hints
};

export default pubtator;