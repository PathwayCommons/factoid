import fetch from 'node-fetch';
import FetchRetry from 'fetch-retry';
import _ from 'lodash';
import { v1 as uuidv1 } from 'uuid';
import stringSimilarity from 'string-similarity';

import {
  INDRA_DB_BASE_URL,
  INDRA_ENGLISH_ASSEMBLER_URL,
  SEMANTIC_SEARCH_BASE_URL,
  EVIDENCE_LIMIT,
  MAX_STATEMENTS,
  GROUNDING_SEARCH_BASE_URL
} from '../../../../config';

import logger from '../../../logger';
import { INTERACTION_TYPE } from '../../../../model/element/interaction-type/enum';
import { fetchPubmed } from './pubmed/fetchPubmed';
import querystring from 'querystring';
import { getPubmedCitation } from '../../../../util/pubmed';
import { checkHTTPStatus } from '../../../../util';

const MAXIMUM_STRING_SIMILARITY_SCORE = 0.90;
const INDRA_STATEMENTS_URL = INDRA_DB_BASE_URL + 'statements/from_agents';

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

// Map from INDRA Knowledge sources (http://www.indra.bio/#knowledge-sources) to MIRIAM identifier
// Set to null if not registered or ambiguous (e.g. CTD)
const SOURCE_2_MIRIAM = new Map([
  // Reading systems
  [ 'trips', { dbPrefix: null, dbName: null, name: 'TRIPS' } ],
  [ 'reach', { dbPrefix: null, dbName: null, name: 'REACH' } ],
  [ 'sparser', { dbPrefix: null, dbName: null, name: 'Sparser' } ],
  [ 'eidos', { dbPrefix: null, dbName: null, name: 'Eidos' } ],
  [ 'tees', { dbPrefix: null, dbName: null, name: 'TEES' } ],
  [ 'medscan', { dbPrefix: null, dbName: null, name: 'MedScan' } ],
  [ 'rlimsp', { dbPrefix: null, dbName: null, name: 'RLIMS-P' } ],
  [ 'isi', { dbPrefix: null, dbName: null, name: 'ISI/AMR' } ],
  [ 'geneways', { dbPrefix: null, dbName: null, name: 'GeneWays' } ],
  // Biological pathway databases
  [ 'biopax', { dbPrefix: 'pathwaycommons', dbName: 'Pathway Commons', name: 'Pathway Commons' } ],
  [ 'bel', { dbPrefix: null, dbName: null, name: 'Large Corpus / BEL' } ],
  [ 'signor', { dbPrefix: 'signor', dbName: 'SIGNOR', name: 'Signor' } ],
  [ 'biogrid', { dbPrefix: 'biogrid', dbName: 'BioGRID', name: 'BioGRID' } ],
  [ 'tas', { dbPrefix: null, dbName: null, name: 'Target Affinity Spectrum' } ],
  [ 'hprd', { dbPrefix: 'hprd', dbName: 'HPRD', name: 'Human Protein Reference Database' } ],
  [ 'trrust', { dbPrefix: null, dbName: null, name: 'TRRUST Database' } ],
  [ 'phosphoelm', { dbPrefix: null, dbName: null, name: 'Phospho.ELM' } ],
  [ 'virhostnet', { dbPrefix: null, dbName: null, name: 'VirHostNet' } ],
  [ 'ctd', { dbPrefix: null, dbName: null, name: 'The Comparative Toxicogenomics Database' } ],
  [ 'drugbank', { dbPrefix: 'drugbank', dbName: 'DrugBank', name: 'DrugBank' } ],
  [ 'omnipath', { dbPrefix: null, dbName: null, name: 'OmniPath' } ],
  [ 'dgi', { dbPrefix: null, dbName: null, name: 'The Drug Gene Interaction Database' } ],
  [ 'crog', { dbPrefix: null, dbName: null, name: 'Chemical Roles Graph' } ],
  // Custom knowledge bases
  [ 'ndex_cx', { dbPrefix: null, dbName: null, name: 'NDex' } ],
  [ 'hypothesis', { dbPrefix: null, dbName: null, name: 'Hypothesis' } ],
  [ 'biofactoid', { dbPrefix: null, dbName: null, name: 'Biofactoid' } ],
  [ 'minerva', { dbPrefix: null, dbName: null, name: 'MINERVA' } ]
]);

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
  const sanitize = text => text ? text.replace(/[\s:]/g,'_') : uuidv1();
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
  const uniqueByText = a => _.uniqWith( a,
    ( arrayVal, other ) => {
      const pmid = _.get( arrayVal, 'pmid' );
      const text = _.get( arrayVal, 'text' );
      const pmidOther = _.get( other, 'pmid' );
      const textOther = _.get( other, 'text' );
      return pmid === pmidOther && text && textOther &&
      ( stringSimilarity.compareTwoStrings( text, textOther ) > MAXIMUM_STRING_SIMILARITY_SCORE );
  });

  const hasPmid = e => _.has( e, 'pmid' );
  const isDocPmid = e => _.get( e, 'pmid' ) === pmid;
  const validPmids = a => _.filter( a , e => hasPmid( e ) && !isDocPmid( e ) );

  let filtered = statements.map( statement => {
    let evidence = _.get( statement, 'evidence', [] );

    // Filter out duplicates wrt to text exceprt
    evidence = uniqueByText( evidence );

    // Has pmid, no self
    evidence = validPmids( evidence );

    // Update the statement evidence
    _.set( statement, 'evidence', evidence );
    return statement;
  });

  // drop statement with empty evidence
  let nonEmpty = filtered.filter( s => !_.isEmpty( _.get( s, 'evidence' ) ));
  return nonEmpty;
};

// An interaction has evidence { pmid, source : [ { pmid, text, } ]}
/**
 * asInteraction
 * transform an INDRA statement {@link https://github.com/sorgerlab/indra/blob/master/indra/resources/statements_schema.json}
 * @param {object} statements a list of INDRA statements
 * @returns a formatted object used downstream/UI
 *   - type {string} the biofactoid model type
 *   - sentence {string} english description
 *   - evidence {object} list of evidence, grouped by PMID
 *     - pmid {string}
 *     - source {object} list of sources for PMID
 *       - pmid {string}
 *       - text {string} the text exerpt, possibly null
 *       - hash {number} the has for the INDRA evidence element
 *       - dbPrefix {string} the MIRIAM-registered collection prefix, possibly null
 *       - dbName {string} the MIRIAM-registered collection prefix, possibly null
 *       - name {string} any (possibly non-standard) name I could find
 */
const asInteraction = statements => {

  const groupSharedPmid = a => {
    const pmidGroups = _.groupBy( a, 'pmid' );
    return _.toPairs( pmidGroups ).map( ([ pmid, source ]) => ({ pmid, source }) );
  };

  const mapEvidence = evidence => {
    const { source_api, source_id: dbId = null, pmid = null, text = null, source_hash: hash } = evidence;
    const miriamFields = SOURCE_2_MIRIAM.get( source_api );
    return _.assign( { pmid, text, dbId, hash }, miriamFields );
  };

  let interactions = statements.map( statement => {
    let evidence = _.get( statement, [ 'evidence' ], [] );

    // translate evidence fields
    evidence = evidence.map( mapEvidence );

    // group by PMID
    evidence = groupSharedPmid( evidence );

    _.set( statement, [ 'evidence' ], evidence );
    return statement;
  });

  return interactions;
};

const INDRA_BY_AGENTS_DEFAULTS = {
  format: 'json',
  ev_limit: EVIDENCE_LIMIT,
  max_stmts: MAX_STATEMENTS,
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
// const getStatements = async () => Object.values( testStatements.statements );

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

/**
 * statements2Interactions
 * Filter and transform INDRA statements into an 'interaction'
 *
 * @param {object} statements An list of INDRA statements {@link https://github.com/sorgerlab/indra/blob/master/indra/resources/statements_schema.json}
 * @param {object} doc A Document, used to filter out self articles from interactions
 * @returns an array of interactions:
 *   - type String the factoid model type
 *   - sentence String description of the interaction
 *   - evidence object list of { pmid, source, citation }
 *     - source list of { pmid, source_api, source_id, text }
 *     - citation is the pubmed citation { pmid, doi, ... }
 *   - participants object list of { name, db_refs }
 *     - db_refs is a list of objects formatted like { "TEXT", [...<database name>] }
 */
const statements2Interactions = async ( statements, doc ) => {

  try {
    const assembledEnglish = await statements2Text( statements );
    const sentences = _.get( assembledEnglish, 'sentences' );

    // pick required fields from statements
    const pickedStatements = statements.map( statement => {
      const id = _.get( statement, [ 'id' ] );
      const rawType = _.get( statement, [ 'type' ] );
      const type = transformIntnType( rawType );
      const sentence = _.get( sentences, id );
      const evidence = _.get( statement, [ 'evidence' ] );
      const participants = _.values( _.pick( statement, [ 'subj', 'obj', 'enz', 'sub', 'members' ] ) );
      return { type, sentence, evidence, participants };
    });

    // filter statements and associated evidence
    const filteredStatements = filterStatements( pickedStatements, doc );
    const interactions = asInteraction( filteredStatements );

    return interactions;

  } catch ( error ) {
    logger.error( `Unable to getInteractions: ${error.message}` );
    throw error;
  }
};

const fillArticleInfo = async ( interactions, citationMap ) => {

  return interactions.map( interaction => {
    let evidence = _.get( interaction, 'evidence' );
    evidence = evidence.map( e => {
      const pmid = _.get( e, 'pmid' );
      const citation = citationMap.get( pmid  );
      return _.assign( e, { citation } );
    });
    _.set( interaction, 'evidence', evidence );
    return interaction;
  });
};

const getCitationMap = async uids => {

  let citations = [];
  if( !_.isEmpty( uids ) ){
    const { PubmedArticleSet } = await fetchPubmed( { uids } );
    citations = PubmedArticleSet.map( PubmedArticle => {
      const citation = getPubmedCitation( PubmedArticle );
      const { pmid } = citation;
      return ([ pmid, citation ]);
    });
  }
  const citationMap = new Map( citations );
  return citationMap;
};

const getPmids = interactions => interactions.map( interaction => {
  const evidence = _.get( interaction, 'evidence' );
  const pmids = evidence.map( e => _.get( e, 'pmid' ) );
  return _.flatten( pmids );
});

/**
 * search
 * Search the INDRA database for interactions and evidence
 *
 * @param {object} element An Element to search for (entity, interaction)
 * @param {object} doc A Document, used to filter out self articles from interactions
 * @returns an array of interactions
 */
 const search = async ( element, doc ) => {

  try {
    const indraParams = await getIndraParams( element );
    const statements = await getStatements( indraParams );
    const interactions = await statements2Interactions( statements, doc );

    const uids = getPmids( interactions );
    const citationMap = await getCitationMap( uids );

    // TODO: Globally rank pmids then use to order evidence using semanticsearch
    await fillArticleInfo( interactions, citationMap );
    return interactions;

  } catch ( error ) {
    logger.error( `INDRA search failed: ${error.message}` );
    throw error;
  }
};

export { search, semanticSearch };
