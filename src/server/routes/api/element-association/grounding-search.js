import fetch from 'node-fetch';
import _ from 'lodash';

import { GROUNDING_SEARCH_BASE_URL } from '../../../../config';
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

const searchAll = opts => query( opts, 'search' );

const search = opts => {
  let { limit, offset, namespace, name, organismCounts } = opts;

  let queryOpts = { q: name };

  if ( organismCounts ) {
    let cmp = ( a, b ) => organismCounts[ b ] - organismCounts[ a ];
    let nonZero = taxonId => organismCounts[taxonId] !== 0;
    let organismOrdering = Object.keys( organismCounts ).filter( nonZero ).sort( cmp );

    queryOpts.organismOrdering = organismOrdering;
  }

  if( namespace ){
    queryOpts.namespace = namespace;
  }

  return searchAll( queryOpts )
    .then( ents => ents.slice( offset, offset + limit ) )
    .catch( err => {
      logger.error(`Aggregate search failed`);
      logger.error(err);

      throw err;
    } );
};

const searchByXref = ( db, id ) => {
  return get( { id, namespace: db } )
    .then( res => {
      let dbXref = _.find( res.dbXrefs, xref => xref.db == 'GeneID' );
      return _.get( dbXref, 'id', null );
    } )
    .then( id => {
      if ( id == null ) {
        return Promise.resolve( null );
      }

      return get( { id, namespace: 'ncbi' } );
    } );
};

export { get, search, searchByXref };
