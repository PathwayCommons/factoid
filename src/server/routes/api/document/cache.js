import NodeCache from 'node-cache';
import cron from 'node-cron';

import { CRON_SCHEDULE_DOCCACHE_UPDATE } from '../../../../config.js';
import { getDocuments } from '.';
import logger from '../../../logger';

const cache = new NodeCache();

const DOCCACHE_KEY = Object.freeze({
  SEARCH: 'search',
  LATEST: 'latest'
});

let docCache = {
  /**
   * Set or replace the Document cache
   * @param {string} key - The key to retrieve from the cache
   */
  update: async function( key, opts = {}) {
    try {
      logger.info( `Started update of Document cache` );
      const data = await getDocuments( opts );
      cache.set( key, data );
      logger.info( `Completed update of Document cache` );
    } catch( err ){
      logger.error( `Error updating cache with Documents: ${err.message}` ); // swallow
    }
  },

  /**
   * Get a value from the Document cache
   * @param {string} key - The key to retrieve from the cache
   */
  get: async function( key ) {
    try {
      logger.info( `Get from cache with ${key}` );
      let exists = cache.has( key );
      if( !exists ){
        let opts = {};
        if( key === DOCCACHE_KEY.SEARCH ){
          opts = { limit: null };
        }
        await this.update( key, opts );
      }
      return cache.get( key );
    } catch( err ){
      logger.error( `Error getting from cache: ${err.message}` ); // swallow
    }
  },

  delete: function( key ){
    return cache.del( key );
  }

};

cron.schedule( CRON_SCHEDULE_DOCCACHE_UPDATE, async () => {
  logger.debug( `Running Document cache update cron job` );
  await docCache.update( DOCCACHE_KEY.SEARCH, { limit: null } );
});

export {
  docCache,
  DOCCACHE_KEY
};

