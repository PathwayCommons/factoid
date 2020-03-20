import fetch from 'node-fetch';

import { INDRA_STATEMENTS_URL, INDRA_ENGLISH_ASSEMBLER_URL } from '../../../../config';
import logger from '../../../logger';
import { tryPromise, memoize } from '../../../../util';
import querystring from 'querystring';
import LRUCache from 'lru-cache';

const QUERY_CACHE_SIZE = 1000;

const getInteractions = (agent0, agent1) => {
  return (
    tryPromise( () => getStatements(agent0, agent1) )
      .then( stmts => {
        return assembleEnglish( stmts )
          .then( res => res.json() )
          .then( js => {
            const sentences = js.sentences;

            const extractInteraction = statement => {
              let {id, type, evidence} = statement;
              return {
                text: sentences[id],
                type,
                pmid: evidence[0].pmid
              };
            };

            let intns = stmts.map( extractInteraction );
            return intns;
          } );
      } )
  );
};

const getStatements = (agent0, agent1) => {
  let query = { format: 'json-js', agent0, agent1 };
  let addr = INDRA_STATEMENTS_URL + '?' + querystring.stringify( query );
  return (
    tryPromise( () => fetch(addr) )
      .then( res => res.json() )
      .then( js => Object.values(js.statements) )
  );
};

const assembleEnglish = statements => {
  let addr = INDRA_ENGLISH_ASSEMBLER_URL;
  return fetch( addr, {
    method: 'post',
    body: JSON.stringify({statements}),
    headers: { 'Content-Type': 'application/json' }
  } );
};

const searchAll = memoize( (agent0, agent1) => getInteractions( agent0, agent1 ),
                            LRUCache({ max: QUERY_CACHE_SIZE }) );


export const search = opts => {
  let { agent0, agent1, offset, limit } = opts;
  return tryPromise( () => searchAll(agent0.toUpperCase(), agent1.toUpperCase()) )
    .then( intns => intns.slice( offset, offset + limit ) )
    .catch( err => {
      logger.error(`Finding indra interactions failed`);
      logger.error(err);

      throw err;
    } );
};
