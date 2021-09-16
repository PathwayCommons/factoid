import fetch from 'node-fetch';
import FetchRetry from 'fetch-retry';
import _ from 'lodash';
// import { parse as dateParse } from 'date-fns';
import uuid from 'uuid';
// import Heap from 'heap';

import { INDRA_DB_BASE_URL, INDRA_ENGLISH_ASSEMBLER_URL, SEMANTIC_SEARCH_BASE_URL, NO_ABSTRACT_HANDLING,
          MIN_SEMANTIC_SCORE, SEMANTIC_SEARCH_LIMIT } from '../../../../config';
import logger from '../../../logger';
import { tryPromise } from '../../../../util';
import { INTERACTION_TYPE } from '../../../../model/element/interaction-type/enum';
import { fetchPubmed } from './pubmed/fetchPubmed';
import querystring from 'querystring';
import { getPubmedCitation } from '../../../../util/pubmed';

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
  .then( res => res.json() );
};

// MIRIAM registry names https://registry.identifiers.org/registry/
const DB_NAMES = Object.freeze({
  DB_NAME_HGNC: 'HGNC',
  DB_NAME_CHEBI: 'ChEBI'
});

// See https://indra.readthedocs.io/en/latest/modules/statements.html for database formats
const getDocuments = ( templates, queryDoc ) => {
  const getForEl = (elTemplate, elType) => {
    const getAgent = t => {
      let agent;
      let xref = getXref( t );
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

    const getXref = t => {
      let name = t.dbName;
      let xref = null;

      if ( name == DB_NAMES.DB_NAME_CHEBI ) {
        xref = {
          id: t.id,
          db: name
        };
      }
      else {
        xref = _.find( t.dbXrefs, ['db', DB_NAMES.DB_NAME_HGNC] );
      }

      return xref;
    };


    let getIntns;

    if ( elType == INTN_STR ) {
      let pptTemplates = elTemplate.ppts;
      let agent0 = getAgent( pptTemplates[0] );
      let agent1 = getAgent( pptTemplates[1] );

      getIntns = () => getInteractions(agent0, agent1);
    }
    else if ( elType == ENTITY_STR ) {
      let agent = getAgent( elTemplate );
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

const getInteractions = (agent0, agent1) => {
  let getStatementsMemoized = _.memoize( getStatements );
  return (
    tryPromise( () => getStatementsMemoized(agent0, agent1) )
      .then( stmts => {
        return assembleEnglish( stmts )
          .then( res => res.json() )
          .then( js => {
            const sentences = js.sentences;

            const extractInteractions = statement => {
              let {id, type, evidence} = statement;
              let pmids = _.uniq( evidence.map( e => e.pmid ).filter( pmid => pmid != undefined ) );

              return pmids.map( pmid => {
                return {
                  text: sentences[id],
                  type: transformIntnType(type),
                  pmid
                };
              } );
            };

            let intns = _.flatten( stmts.map( extractInteractions ) );
            return intns;
          } );
      } )
  );
};

const getStatements = (agent0, agent1) => {
  let query = { format: 'json-js', agent0 };

  // if agent1 parameter is set the query is made for an interaction
  // else it is made for an entity
  if ( agent1 != null ) {
    query.agent1 = agent1;
  }

  let addr = INDRA_STATEMENTS_URL + '?' + querystring.stringify( query );
  return tryPromise( () => fetchRetryUrl(addr) )
    .then( res =>
      res.json()
      )
    .then( js => Object.values(js.statements) )
    .catch( err => {
      let errStr = 'Unable to retrieve the indra staments for the entity ';

      if ( agent1 ) {
        errStr += `pair '${agent0}-${agent1}'`;
      }
      else {
        errStr += agent0;
      }
      logger.error( errStr );
      logger.error( err );
      return [];
    } );
};

const assembleEnglish = statements => {
  let addr = INDRA_ENGLISH_ASSEMBLER_URL;
  return fetchRetryUrl( addr, {
    method: 'post',
    body: JSON.stringify({statements}),
    headers: { 'Content-Type': 'application/json' }
  } )
  .catch( err => {
    logger.error( `Unable to assemble english for the indra statements` );
    logger.error( err );
    throw err;
  } );
};


const searchDocuments = opts => {
  let { templates, doc } = opts;
  return tryPromise( () => getDocuments(templates, doc) )
    .catch( err => {
      logger.error(`Finding indra documents failed`);
      logger.error(err);

      throw err;
    } );
};

export { searchDocuments, semanticSearch };
