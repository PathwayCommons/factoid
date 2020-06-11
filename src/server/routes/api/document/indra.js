import fetch from 'node-fetch';
import _ from 'lodash';
import { parse as dateParse } from 'date-fns';
import Heap from 'heap';

import { INDRA_DB_BASE_URL, INDRA_ENGLISH_ASSEMBLER_URL, SEMANTIC_SEARCH_BASE_URL } from '../../../../config';
import logger from '../../../logger';
import { tryPromise } from '../../../../util';
import { INTERACTION_TYPE } from '../../../../model/element/interaction-type/enum';
import { fetchPubmed } from './pubmed/fetchPubmed';
import querystring from 'querystring';

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

const getDocuments = ( templates, queryArticle ) => {
  const getForIntn = intnTemplate => {
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

    let pptTemplates = intnTemplate.ppts;
    let agent0 = getAgent( pptTemplates[0] );
    let agent1 = getAgent( pptTemplates[1] );

    return tryPromise( () => getInteractions(agent0, agent1) )
      .then( intns => {
        intns.forEach( intn => intn.intnId = intnTemplate.id );
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

    const getPmid = article => article.PubmedData.ArticleIdList.find( o => o.IdType == 'pubmed' ).id;
    const getMedlineArticle = article => article.MedlineCitation.Article;

    const getSemanticScores = articles => {
      if ( SORT_BY_DATE ) {
        let semanticScores = null;
        return { semanticScores, articles };
      }

      const getAbstract = article => {
        let abstract = getMedlineArticle(article).Abstract;
        if ( _.isString( abstract ) ) {
          return abstract;
        }
        if ( _.isArray( abstract ) ) {
          return abstract[ 0 ];
        }
        return null;
      };

      let url = SEMANTIC_SEARCH_BASE_URL;
      let queryText = getAbstract( queryArticle );
      let queryUid = getPmid( queryArticle );
      let query = { uid: queryUid, text: queryText };

      let documents = articles.map( article => {
        let text = getAbstract( article );
        let uid = getPmid( article );

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

        if ( medlineDate ) {
          return new Date( medlineDate );
        }

        if ( month != null && isNaN( month ) ) {
            month = dateParse(month, 'MMM', new Date()).getMonth() + 1;
        }

        // Date class accepts the moth indices starting by 0
        month = month - 1;

        return new Date( year, month, day ).getTime();
    };

    const filterByDate = articles => {
      // if the sort operation wil be based on the semantic search
      // then filter the most current papers before sorting
      if ( !SORT_BY_DATE && articles.length > SEMANTIC_SEARCH_LIMIT ) {
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
      .then( getSemanticScores )
      .then( ( { articles, semanticScores } ) => {
        let semanticScoreById = _.groupBy( semanticScores, 'uid' );
        let arr = articles.map( article => {
          let pubmed = getMedlineArticle( article );
          let pmid = getPmid( article );
          let elements = o[ pmid ];
          // prevent duplication of the same interactions in a document
          elements = _.uniqWith( elements, _.isEqual );
          elements.forEach( e => delete e.pmid );

          return { elements, pmid, pubmed };
        } );

        const getSemanticScore = doc => _.get( semanticScoreById, [ doc.pmid, 0, 'score' ] );

        const getNegativeScore = ( doc ) => {
          let fcn = SORT_BY_DATE ? () => getPubTime(doc.pubmed) : getSemanticScore;
          return -fcn( doc );
        };

        if ( !SORT_BY_DATE ) {
          arr = arr.filter( doc => getSemanticScore( doc ) > MIN_SEMANTIC_SCORE );
        }

        arr = _.sortBy( arr, getNegativeScore );

        return arr;
      } );
  };

  let promises = templates.map( getForIntn );
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
  let query = { format: 'json-js', agent0, agent1 };
  let addr = INDRA_STATEMENTS_URL + '?' + querystring.stringify( query );
  return tryPromise( () => fetch(addr) )
    .then( res => res.json() )
    .then( js => Object.values(js.statements) )
    .catch( err => {
      logger.error( `Unable to retrieve the indra staments for the entity pair '${agent0}-${agent1}'` );
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
  let { templates, article } = opts;
  return tryPromise( () => getDocuments(templates, article) )
    .catch( err => {
      logger.error(`Finding indra documents failed`);
      logger.error(err);

      throw err;
    } );
};
