import fetch from 'node-fetch';
import FetchRetry from 'fetch-retry';
import _ from 'lodash';
import uuid from 'uuid';

import {
  INDRA_DB_BASE_URL,
  INDRA_ENGLISH_ASSEMBLER_URL,
  SEMANTIC_SEARCH_BASE_URL,
  NO_ABSTRACT_HANDLING,
  MIN_SEMANTIC_SCORE,
  SEMANTIC_SEARCH_LIMIT,
  GROUNDING_SEARCH_BASE_URL
} from '../../../../config';

import logger from '../../../logger';
import { tryPromise } from '../../../../util';
import { INTERACTION_TYPE } from '../../../../model/element/interaction-type/enum';
import { fetchPubmed } from './pubmed/fetchPubmed';
import querystring from 'querystring';
import { getPubmedCitation } from '../../../../util/pubmed';
import { checkHTTPStatus } from '../../../../util';
import fromagents from '../../../../../fromagents.json';

const INDRA_STATEMENTS_URL = INDRA_DB_BASE_URL + 'statements/from_agents';
const SORT_BY_DATE = false; // TODO remove

const FETCH_RETRIES = 20;
const FETCH_RETRY_DELAY = 6000;
const FETCH_RETRY_DELAY_DELTA = 1000;

const SUB_MODIFICATION_TYPES = ['Phosphorylation', 'Dephosphorylation', 'Dephosphorylation',
  'Deubiquitination', 'Methylation', 'Demethylation'];
const BASE_MODIFICATION_TYPES = ['Sumoylation', 'Desumoylation', 'Hydroxylation', 'Dehydroxylation',
  'Acetylation', 'Deacetylation', 'Glycolsyation', 'Deglycolsyation', 'Farnesylation',
  'Defarnesylation', 'Geranylgeranylation', 'Degeranylgeranylation', 'Palmitoylation',
  'Depalmitoylation', 'Myristoylation', 'Demyristoylation', 'Ribosylation', 'Deribosylation',
  'Autophosphorylation', 'Transphosphorylation'];
const TRANSCRIPTION_TRANSLATION_TYPES = ['IncreaseAmount', 'DecreaseAmount'];
const BINDING_TYPES = ['Complex'];

const INTN_STR = 'interaction';
const ENTITY_STR = 'entity';

const DB_PREFIXES = Object.freeze({
  DB_PREFIX_HGNC: 'hgnc',
  DB_PREFIX_CHEBI: 'CHEBI',
  DB_PREFIX_UNIPROT: 'uniprot',
  DB_PREFIX_NCBI_GENE: 'ncbigene'
});

const DB_NAMES = Object.freeze({
  DB_NAME_HGNC: 'HGNC',
  DB_NAME_UNIPROT: 'UniProt Knowledgebase',
  DB_NAME_CHEBI: 'ChEBI',
  DB_NAME_NCBI_GENE: 'NCBI Gene'
});

const toJson = res => res.json();

const mapId = async ( id, dbfrom, dbto ) => {
  const body = JSON.stringify({ id: [ id ], dbfrom, dbto });
  const url = `${GROUNDING_SEARCH_BASE_URL}/map`;
  const findMapped = res => _.find( res, [ 'id', id ] );
  const findDbXref = res => _.find( _.get( res, 'dbXrefs' ), [ 'db', dbto ] );

  try {
    const fetchResponse = await fetch( url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body
    });
    checkHTTPStatus( fetchResponse );
    const json = await fetchResponse.json();
    const mapped = findMapped( json );
    const dbXref = findDbXref( mapped );
    return dbXref;

  } catch ( error ) {
    logger.error( `Error mapId: ${error}` );
  }
};

let sortByDate = SORT_BY_DATE;

const fetchRetry = FetchRetry(fetch);
const fetchRetryUrl = ( url, opts ) => {
  let retryOpts = {
    retryDelay: FETCH_RETRY_DELAY + Math.round(Math.random() * FETCH_RETRY_DELAY_DELTA),
    retryOn: function( attempt, error, response ) {
      if ( response == null ) {
        logger.error(`Null response for ${url}`);
        logger.info(`Retrying, attempt ${attempt + 1}`);
        return true;
      }
      // retry on any network error, or 4xx or 5xx status codes
      const { statusText, status, ok } = response;
      if ( attempt < FETCH_RETRIES && !ok ) {
        logger.error(`Error for ${url}`);
        logger.error(`${status}: ${statusText}`);
        logger.info(`Retrying, attempt ${attempt + 1}`);
        return true;
      } else {
        return false;
      }
    }
  };

  return fetchRetry(url, _.extend( opts, retryOpts ));
};


const semanticSearch = params => {
  return fetch( SEMANTIC_SEARCH_BASE_URL, {
    method: 'POST',
    body: JSON.stringify( params ),
    headers: { 'Content-Type': 'application/json' }
  })
  .then( checkHTTPStatus )
  .then( toJson );
};

// Try to update with a corresponding dbXref from UniProt or HGNC
// INDRA won't deal with NCBI Gene IDs
const getDbXref = async entityTemplate => {
  const { id, dbName: db } = entityTemplate;
  let dbXref = { db, id };

  if ( db == DB_NAMES.DB_NAME_NCBI_GENE ) {
    const mapResult = await mapId( id, DB_PREFIXES.DB_PREFIX_NCBI_GENE, DB_PREFIXES.DB_PREFIX_UNIPROT );
    if ( mapResult ){
      _.set( dbXref, 'db', DB_NAMES.DB_NAME_UNIPROT );
      _.set( dbXref, 'id', _.get( mapResult, 'id' ) );
    } else {
      const hgncXref = _.find( entityTemplate.dbXrefs, ['db', DB_NAMES.DB_NAME_HGNC] );
      if( hgncXref ){
        _.set( dbXref, 'db', DB_NAMES.DB_NAME_HGNC );
        _.set( dbXref, 'id', _.get( hgncXref, 'id' ) );
      }
    }
  }
  return dbXref;
};

// Map to the INDRA-specific ground
// https://indra.readthedocs.io/en/latest/modules/statements.html#grounding-and-db-references
const dbXref2Agent = ( dbXref, template ) => {

  let agent;
  const sanitizeId = id => {
    let arr = id.split(':');
    if ( arr.length == 1 ) {
      return arr[0];
    }
    return arr[1];
  };
  const { db, id } = dbXref;

  switch( db ) {
    case DB_NAMES.DB_NAME_HGNC:
      agent = `${ sanitizeId( id ) }@HGNC`;
      break;
    case DB_NAMES.DB_NAME_UNIPROT:
      agent = `${id}@UP`;
      break;
    case DB_NAMES.DB_NAME_CHEBI:
      agent = `CHEBI:${id}@CHEBI`;
      break;
    default:
      agent = `${_.get( template, 'name' )}@TEXT`;
  }
  return agent;
};

// Generate the parameters to send to INDRA
// https://github.com/indralab/indra_db/tree/master/rest_api
const getIndraParams = async element => {

  const agents = {};
  const sanitize = text => text.replace(/[\s:]/g,'_');
  const setAgent = ( dbXref, template ) => {
    const { db, id } = dbXref;
    let agent = dbXref2Agent( dbXref, template );
    _.set( agents, `agent_${sanitize( db )}_${sanitize( id )}`, agent );
  };
  const template = element.toSearchTemplate();
  const isInteraction = element.isInteraction();

  if( isInteraction ){
    const { ppts: participants } = template;

    for ( const pTemplate of participants ){
      let dbXref = await getDbXref( pTemplate );
      setAgent( dbXref, pTemplate );
    }
  } else {
    let dbXref = await getDbXref( template );
    setAgent( dbXref, template );
  }

  const indraOpts = _.assign( {}, agents );
  return indraOpts;
};

/**
 * search
 * Search the INDRA database for interactions and evidence
 *
 * @param {object} element An Element
 * @param {object} doc A Document
 * @returns
 */
const search = async ( element, doc ) => {
  const indraParams = await getIndraParams( element );
  const statements = await getStatements( indraParams );
  let interactions = await statements2Interactions( statements, doc );
  return interactions;
};

const transformIntnType = indraType => {
  if ( SUB_MODIFICATION_TYPES.includes( indraType ) ) {
    return indraType.toLowerCase();
  }

  if ( BASE_MODIFICATION_TYPES.includes( indraType ) ) {
    return INTERACTION_TYPE.MODIFICATION.value;
  }

  if ( TRANSCRIPTION_TRANSLATION_TYPES.includes( indraType ) ) {
    return INTERACTION_TYPE.TRANSCRIPTION_TRANSLATION.value;
  }

  if ( BINDING_TYPES.includes( indraType ) ) {
    return INTERACTION_TYPE.BINDING.value;
  }

  return INTERACTION_TYPE.INTERACTION.value;
};

const filterStatements = ( statements, doc ) => {
  const { pmid } = doc.citation();

  const hasPmid = e => _.has( e, 'pmid' );
  const isDocPmid = e => _.get( e, 'pmid' ) === pmid;
  const validPmids = e => hasPmid( e ) && !isDocPmid( e );

  const uniquePmidText = a => _.uniqWith( a,
    ( arrVal, othVal ) => arrVal.pmid == othVal.pmid &&
    _.get( arrVal, 'text' ) === _.get( othVal, 'text', '' )
  );

  const groupSharedPmid = a => {
    const pmidGroups = _.groupBy( a, 'pmid' );
    const grouped = _.values( pmidGroups ).map( evidenceSet => {
      const text = _.flatten( _.compact( evidenceSet.map( e => _.get( e, 'text' ) ) ) );
      return _.assign( {}, _.first( evidenceSet ), { text } );
    });
    return grouped;
  };

  let filtered = statements.map( statement => {
    let evidence = _.get( statement, 'evidence', [] );

    // Has pmid, no self
    evidence = _.filter( evidence , validPmids );

    // Unique wrt pmid and text
    evidence = uniquePmidText( evidence );

    // aggregate text for identical pmid
    evidence = groupSharedPmid( evidence );

    // Update the evidence for this statement
    _.set( statement, 'evidence', evidence );
    return statement;
  });

  // drop statement with empty evidence
  let nonEmpty = filtered.filter( s => !_.isEmpty( _.get( s, 'evidence' ) ));

  return nonEmpty;

};

const statements2Interactions = async ( statements, doc ) => {
  const evidenceFields = new Set([ 'source_api', 'source_id', 'pmid', 'text' ]);

  try {
    const assembledEnglish = await statements2Text( statements );
    const sentences = _.get( assembledEnglish, 'sentences' );

    // pre-filter statements
    let filteredStatements = filterStatements( statements, doc );

    // format statements
    return filteredStatements.map( statement => {
      const id = _.get( statement, [ 'id' ] );
      const rawType = _.get( statement, [ 'type' ] );
      const type = transformIntnType( rawType );
      const sentence = _.get( sentences, id );
      const evidences = _.get( statement, [ 'evidence' ] );
      const participants = _.values( _.pick( statement, [ 'subj', 'obj', 'enz', 'sub', 'members' ] ) );
      const evidence = evidences.map( evidence => _.pick( evidence, ...evidenceFields ) );
      return { type, sentence, evidence, participants };
    });

  } catch ( error ) {
    logger.error( `Unable to getInteractions: ${error.message}` );
    throw error;
  }
};

const INDRA_BY_AGENTS_DEFAULTS = {
  format: 'json',
  ev_limit: 10,
  max_stmts: 10,
  best_first: true
};

const statementsByAgent = async opts => {
  // return Object.values( fromagents.statements );
  let params = _.defaults( opts, INDRA_BY_AGENTS_DEFAULTS );
  const url = INDRA_STATEMENTS_URL + '?' + querystring.stringify( params );
  try {
    const fetchResponse = await fetchRetryUrl( url );
    checkHTTPStatus( fetchResponse );
    const json = await fetchResponse.json();
    const statements = Object.values( json.statements );
    return statements;

  } catch ( error ) {
    logger.error( `Unable to retrieve the indra statements for ${JSON.stringify( opts )}\n${error.message}`);
    return [];
  }
};

const getStatements = _.memoize( statementsByAgent );

const statements2Text = async statements => {
  let addr = INDRA_ENGLISH_ASSEMBLER_URL;

  try {
    const fetchResponse = await fetchRetryUrl( addr, {
      method: 'POST',
      body: JSON.stringify( { statements } ),
      headers: {
        'Content-Type': 'application/json'
      }
    });
    checkHTTPStatus( fetchResponse );
    const json = await fetchResponse.json();
    return json;

  } catch ( error ) {
    logger.error( `Unable to assemble english for the indra statements: ${error.message}` );
    throw error;
  }
};

const searchDocuments = () => {
  return Promise.resolve(null);
  // try {
  //   let { templates, doc } = opts;
  //   const docs = await getDocuments( templates, doc );
  //   return docs;

  // } catch ( error ) {
  //   logger.error( `Finding indra documents failed: ${error.message}` );
  //   throw error;
  // }
};

export { searchDocuments, semanticSearch, search };
