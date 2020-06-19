import fetch from 'node-fetch';
import _ from 'lodash';
import { parse as dateParse } from 'date-fns';
import uuid from 'uuid';
import Heap from 'heap';

import { INDRA_DB_BASE_URL, INDRA_ENGLISH_ASSEMBLER_URL, SEMANTIC_SEARCH_BASE_URL, NO_ABSTRACT_HANDLING } from '../../../../config';
import logger from '../../../logger';
import { tryPromise } from '../../../../util';
import { INTERACTION_TYPE } from '../../../../model/element/interaction-type/enum';
import { fetchPubmed } from './pubmed/fetchPubmed';
import querystring from 'querystring';
import { getPubmedCitation } from '../../../../util/pubmed';

const INDRA_STATEMENTS_URL = INDRA_DB_BASE_URL + 'statements/from_agents';
const MIN_SEMANTIC_SCORE = 0.47;
const SORT_BY_DATE = false;
const SEMANTIC_SEARCH_LIMIT = 30;

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

const getDocuments = ( templates, queryDoc ) => {
  const getForEl = (elTemplate, elType) => {
    const getAgent = t => {
      let agent;
      let xref = getXref( t );
      if ( xref ) {
        agent = sanitizeId(xref.id) + '@' + xref.db;
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
      let ns = t.namespace;
      let xref = null;

      if ( ns == 'chebi' ) {
        xref = {
          id: t.id,
          db: ns
        };
      }
      else {
        xref = _.find( t.dbXrefs, x => x.db.toLowerCase() == 'hgnc' );
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
        intns.forEach( intn => intn.intnId = elTemplate.id );
        return _.groupBy( intns, 'pmid' );
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

    const getMedlineArticle = article => article.MedlineCitation.Article;

    const getSemanticScores = articles => {
      if ( sortByDate ) {
        let semanticScores = null;
        return { semanticScores, articles };
      }

      let { abstract: queryText, pmid: queryUid = uuid() } = queryDoc.citation();

      if ( queryText == null ) {
        queryText = handleNoQueryAbastract( queryDoc );
      }

      let url = SEMANTIC_SEARCH_BASE_URL;
      let query = { uid: queryUid, text: queryText };

      let documents = articles.map( article => {
        const { abstract: text , pmid: uid } = article;

        if ( text == null || uid == null ) {
          return null;
        }

        return { text, uid };
      } );

      documents = _.filter( documents, d => d != null );

      return fetch( url, {
        method: 'post',
        body: JSON.stringify({ query, documents }),
        headers: { 'Content-Type': 'application/json' }
      })
      .then( res => res.json() )
      .then( semanticScores => ( { articles, semanticScores } ) );
    };

    const getPubTime = article => {
        let dateJs = article.Journal.JournalIssue.PubDate;
        let { Day: day, Year: year, Month: month, MedlineDate: medlineDate } = dateJs;

        try {
          if ( medlineDate ) {
            return new Date( medlineDate ).getTime();
          }

          if ( month != null && isNaN( month ) ) {
              month = dateParse(month, 'MMM', new Date()).getMonth() + 1;
          }

          // Date class accepts the moth indices starting by 0
          month = month - 1;

          return new Date( year, month, day ).getTime();
        }
        catch ( e ) {
          logger.error( e );
          // if date could not be parsed return the minimum integer value
          return Number.MIN_SAFE_INTEGER;
        }
    };

    const filterByDate = articles => {
      // if the sort operation wil be based on the semantic search
      // then filter the most current papers before sorting
      if ( !sortByDate && articles.length > SEMANTIC_SEARCH_LIMIT ) {
        const cmp = ( a, b ) => {
          const getDate = e => getPubTime( getMedlineArticle( e ) );
          return getDate( a ) - getDate( b );
        };

        articles = Heap.nlargest( articles, SEMANTIC_SEARCH_LIMIT, cmp );
      }

      return articles;
    };

    return tryPromise( () => fetchPubmed({ uids: pmids }) )
      .then( o => o.PubmedArticleSet )
      .then( filterByDate )
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

        const getSemanticScore = doc => _.get( semanticScoreById, [ doc.pmid, 0, 'score' ] );
        const getNegativeScore = doc => -getSemanticScore( doc );
        arr = arr.filter( doc => getSemanticScore( doc ) > MIN_SEMANTIC_SCORE );
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
  return (
    tryPromise( () => getStatements(agent0, agent1) )
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
  return tryPromise( () => fetch(addr) )
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
      throw err;
    } );
};

const assembleEnglish = statements => {
  let addr = INDRA_ENGLISH_ASSEMBLER_URL;
  return fetch( addr, {
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


export const searchDocuments = opts => {
  let { templates, doc } = opts;
  return tryPromise( () => getDocuments(templates, doc) )
    .catch( err => {
      logger.error(`Finding indra documents failed`);
      logger.error(err);

      throw err;
    } );
};
