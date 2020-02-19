import fetch from 'node-fetch';

import { INDRA_INTERACTION_BASE_URL } from '../../../../config';
import logger from '../../../logger';
import { tryPromise, memoize } from '../../../../util';
import querystring from 'querystring';
import LRUCache from 'lru-cache';

const QUERY_CACHE_SIZE = 1000;
const BASE_URL = INDRA_INTERACTION_BASE_URL;

const request = ( endpt, query ) => {
  let addr = BASE_URL + `${endpt}?` + querystring.stringify( query );

  return (
    tryPromise( () => fetch( addr ) )
      .then( res => res.json() )
  );
};

const searchAll = memoize( opts => request( 'find-interactions', opts ),
                            LRUCache({ max: QUERY_CACHE_SIZE }) );


export const search = opts => {
  let { sources, targets, sign, offset, limit } = opts;
  let queryOpts = { source: sources, target: targets, sign };
  return tryPromise( () => searchAll(queryOpts) )
    .then( intns => intns.slice( offset, offset + limit ) )
    .catch( err => {
      logger.error(`Finding indra interactions failed`);
      logger.error(err);

      throw err;
    } );
};
