const fetch = require('node-fetch');

const { GROUNDING_SEARCH_BASE_URL } = require('../../../../config');
const logger = require('../../../logger');

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

  let queryOpts = { namespace, q: name };
  if ( organismCounts ) {
    let cmp = ( a, b ) => organismCounts[ b ] - organismCounts[ a ];
    let nonZero = taxonId => organismCounts[taxonId] !== 0;
    let organismOrdering = Object.keys( organismCounts ).filter( nonZero ).sort( cmp );

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

module.exports = { get, search };
