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

const INDRA_FROM_AGENTS_DEFAULTS = {
  format: 'json-js',
  ev_limit: 10,
  max_stmts: 10,
  best_first: true
};

const DB_PREFIXES = Object.freeze({
  DB_PREFIX_HGNC: 'hgnc',
  DB_PREFIX_CHEBI: 'CHEBI',
  DB_PREFIX_UNIPROT: 'uniprot',
  DB_PREFIX_NCBI_GENE: 'ncbigene'
});

const DB_NAMES = Object.freeze({
  DB_NAME_HGNC: 'HGNC',
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

// See https://indra.readthedocs.io/en/latest/modules/statements.html for database formats
const getDocuments = ( templates, queryDoc ) => {
  const getForEl = async (elTemplate, elType) => {
    const getAgent = async t => {
      let agent;
      let xref = await getXref( t );
      if ( xref ) {
        agent = sanitizeId(xref.id) + '@' + xref.db.toUpperCase();
      }
      else {
        agent = t.name + '@TEXT';
      }

      return agent;
    };

    // for some datasources id may be in a form like "HGNC:10937"
    // in that cases just consider the string coming after ":"
    const sanitizeId = id => {
      let arr = id.split(':');

      if ( arr.length == 1 ) {
        return arr[0];
      }

      return arr[1];
    };

    const getXref = async t => {
      let name = t.dbName;
      let xref = null;

      if ( name == DB_NAMES.DB_NAME_CHEBI ) {
        xref = {
          id: t.id,
          db: name
        };

      } else if ( name == DB_NAMES.DB_NAME_NCBI_GENE ) {
        xref = await mapId( t.id, DB_PREFIXES.DB_PREFIX_NCBI_GENE, DB_PREFIXES.DB_PREFIX_UNIPROT );
      }

      if ( !xref ) {
        xref = _.find( t.dbXrefs, ['db', DB_NAMES.DB_NAME_HGNC] );
      }

      return xref;
    };


    let getIntns;

    if ( elType == INTN_STR ) {
      let pptTemplates = elTemplate.ppts;
      let agent0 = await getAgent( pptTemplates[0] );
      let agent1 = await getAgent( pptTemplates[1] );

      getIntns = () => getInteractions(agent0, agent1);
    }
    else if ( elType == ENTITY_STR ) {
      let agent = await getAgent( elTemplate );
      getIntns = () => getInteractions(agent);
    }
    else {
      logger.error( `${elType} is not a valid element type!` );
      getIntns = () => [];
    }

    return tryPromise( () => getIntns() )
      .then( intns => {
        let ret;

        intns.forEach( intn => intn.elId = elTemplate.elId );

        const filteredIntns = (
          _.uniqBy( intns, 'pmid' )
          .sort((a, b) => parseInt(b.pmid) - parseInt(a.pmid)) // sort by pmid as proxy for date -- higher pmid = newer
          .slice(0, SEMANTIC_SEARCH_LIMIT + 1) // limit per-ele pmid count for s.s.
        );

        ret = _.groupBy( filteredIntns, 'pmid' );

        return ret;
      } )
      .catch( err => {
        logger.error( err );
        return {};
      } );
  };

  const merger = (objValue, srcValue) => {
    if (_.isArray(objValue)) {
      return objValue.concat(srcValue);
    }
  };

  const transform = o => {
    let pmids = Object.keys( o );

    if ( pmids.length == 0 ) {
      return [];
    }

    const handleNoQueryAbastract = doc => {
      if ( NO_ABSTRACT_HANDLING == 'text' ) {
        return doc.toText();
      }
      else if ( NO_ABSTRACT_HANDLING == 'date' ) {
        // no need to return a valid abstract since sorting will be based on date
        sortByDate = true;
        return null;
      }
      else {
        throw `${NO_ABSTRACT_HANDLING} is not a valid value for NO_ABSTRACT_HANDLING environment variable!`;
      }
    };

    // const getMedlineArticle = article => article.MedlineCitation.Article;

    const getSemanticScores = articles => {
      if ( sortByDate ) {
        let semanticScores = null;
        return { semanticScores, articles };
      }

      let { abstract: queryText, pmid: queryUid = uuid() } = queryDoc.citation();

      if ( queryText == null ) {
        queryText = handleNoQueryAbastract( queryDoc );
      }

      // let url = SEMANTIC_SEARCH_BASE_URL;
      let query = { uid: queryUid, text: queryText };

      let documents = articles.map( article => {
        const { abstract: text , pmid: uid } = article;

        if ( text == null || uid == null ) {
          return null;
        }

        return { text, uid };
      } );

      documents = _.filter( documents, d => d != null );

      return semanticSearch({ query, documents })
        .then( semanticScores => ( { articles, semanticScores } ) );
    };

    // filter again for case of multiple tempaltes in one query (i.e. document)
    const filteredPmids = (
      pmids.sort((a, b) => parseInt(b) - parseInt(a)) // higher pmids first
      .slice(0, SEMANTIC_SEARCH_LIMIT + 1) // limit
    );

    return tryPromise( () => fetchPubmed({ uids: filteredPmids }) )
      .then( o => o.PubmedArticleSet )
      // .then( filterByDate )
      .then( articles => articles.map( getPubmedCitation ) )
      .then( getSemanticScores )
      .then( ( { articles, semanticScores } ) => {
        let semanticScoreById = _.groupBy( semanticScores, 'uid' );
        let arr = articles.map( article => {
          const { pmid } = article;
          let elements = o[ pmid ];
          // prevent duplication of the same interactions in a document
          elements = _.uniqWith( elements, _.isEqual );
          elements.forEach( e => delete e.pmid );

          return { elements, pmid, pubmed: article };
        } );

        const queryDocPmid = queryDoc.citation().pmid;
        const getSemanticScore = doc => _.get( semanticScoreById, [ doc.pmid, 0, 'score' ] );
        const getNegativeScore = doc => -getSemanticScore( doc );

        arr = arr.filter( doc => getSemanticScore( doc ) > MIN_SEMANTIC_SCORE && doc.pmid != queryDocPmid );
        arr = _.sortBy( arr, getNegativeScore );

        return arr;
      } );
  };

  let promises = [ ...templates.intns.map( e => getForEl( e, INTN_STR ) ),
                    ...templates.entities.map( e => getForEl( e, ENTITY_STR ) ) ];
  return Promise.all( promises )
    .then( res => _.mergeWith( {}, ...res, merger ) )
    .then( transform );
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

const getInteractions = async ( agent0, agent1 ) => {
  let getStatementsMemoized = _.memoize( getStatements );

  try {
    const statements = await getStatementsMemoized( agent0, agent1 );
    const assembledEnglish = await assembleEnglish( statements );
    const sentences = _.get( assembledEnglish, 'sentences' );

    const extractInteractions = statement => {
      const { id, type, evidence } = statement;
      const pmids = _.uniq( evidence.map( e => e.pmid ).filter( pmid => pmid != undefined ) );

      return pmids.map( pmid => {
        return {
          text: sentences[id],
          type: transformIntnType(type),
          pmid
        };
      });
    };

    const interactions = _.flatten( statements.map( extractInteractions ) );
    return interactions;

  } catch ( error ) {
    logger.error( `Unable to getInteractions` );
    logger.error( error );
    throw error;
  }
};

const getStatements = async ( agent0, agent1 ) => {
  let params = _.defaults( { agent0 }, INDRA_FROM_AGENTS_DEFAULTS );
  // if agent1 parameter is set the query is made for an interaction
  // else it is made for an entity
  if ( agent1 != null ) _.set( params, 'agent1', agent1 );
  const url = INDRA_STATEMENTS_URL + '?' + querystring.stringify( params );

  try {
    const fetchResponse = await fetchRetryUrl( url );
    checkHTTPStatus( fetchResponse );
    const json = await fetchResponse.json();
    const statements = Object.values( json.statements );
    return statements;

  } catch ( error ) {
    let errMsg= 'Unable to retrieve the indra staments for the entity ';
    if ( agent1 ) {
      errMsg += `pair '${agent0}-${agent1}'`;
    } else {
      errMsg += agent0;
    }
    logger.error( errMsg );
    logger.error( error );
    return [];
  }
};

const assembleEnglish = async statements => {
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
    logger.error( `Unable to assemble english for the indra statements` );
    logger.error( error );
    throw error;
  }
};


const searchDocuments = async opts => {

  try {
    let { templates, doc } = opts;
    const docs = await getDocuments( templates, doc );
    return docs;

  } catch ( error ) {
    logger.error( `Finding indra documents failed` );
    logger.error( error );
    throw error;
  }
};

export { searchDocuments, semanticSearch };
