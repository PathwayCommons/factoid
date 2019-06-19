import LRUCache from 'lru-cache';
import fetch from 'node-fetch';

import { GROUNDING_SEARCH_BASE_URL, AGGREGATE_CACHE_SIZE } from '../../../../config';
import { memoize } from '../../../../util';
import logger from '../../../logger';

const query = ( opts, endpt ) => {
  return fetch( GROUNDING_SEARCH_BASE_URL + `/${endpt}`, {
    method: 'POST',
    body: JSON.stringify(opts),
    headers: {
      'Content-Type': 'application/json'
    }
  } )
  .then( res => res.json() );
};

const get = opts => {
  return query( opts, 'get' )
    .catch( err => {
      logger.error(`Aggregate get failed`);
      logger.error(err);

      throw err;
    } );
};

const searchAll = memoize( opts => query( opts, 'search' ),
  LRUCache({ max: AGGREGATE_CACHE_SIZE }) );

const search = opts => {
  let { limit, offset, namespace, name, organismCounts } = opts;

  let queryOpts = { namespace, q: name };
  if ( organismCounts ) {
    let cmp = ( a, b ) => organismCounts[ b ] - organismCounts[ a ];
    let organismOrdering = Object.keys( organismCounts ).sort( cmp );
    queryOpts.organismOrdering = organismOrdering;
  }

  return searchAll( queryOpts )
    .then( ents => ents.slice( offset, offset + limit ) )
    .catch( err => {
      logger.error(`Aggregate search failed`);
      logger.error(err);

      throw err;
    } );
};

export { get, search };
