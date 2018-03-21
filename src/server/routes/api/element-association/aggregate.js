const _ = require('lodash');
const Promise = require('bluebird');
const pubchem = require('./pubchem');
const uniprot = require('./uniprot');
const providers = [ uniprot, pubchem ];
const { memoize, stringDistanceMetric } = require('../../../../util');
const LRUCache = require('lru-cache');
const { MAX_SEARCH_SIZE, AGGREGATE_CACHE_SIZE } = require('../../../../config');
const logger = require('../../../logger');

const getProviderByNs = _.memoize( ns => {
  return providers.find( p => p.namespace === ns );
} );

const searchAll = q => {
  let allQ = _.assign({}, q, {
    limit: MAX_SEARCH_SIZE,
    offset: 0
  });

  return searchAllCached( allQ );
};

const searchAllCached = memoize( q => {
  let searchTerm = q.name || q.id;

  let distance = memoize( ent => {
    let provider = getProviderByNs( ent.namespace );
    let undef = Number.MAX_SAFE_INTEGER;
    let dist = undef;

    let checkDist = val => {
      let d = val == null ? undef : stringDistanceMetric( searchTerm, val );

      dist = Math.min( d, dist );
    };

    let check = val => {
      if( _.isArray(val) ){
        val.forEach( checkDist );
      } else {
        checkDist( val );
      }
    };

    provider.distanceFields.forEach( k => check( ent[k] ) );

    return dist;
  }, new Map(), ent => ent.namespace + ':' + ent.id );

  return (
    Promise.all( providers.map( p => p.search( q ) ) ).then( entSets => {
      let ents = _.flatten( entSets );
      let sortedEnts = _.sortBy( ents, distance ); // stable sort

      // n.b. must copy obj, else other cached searched may have distance overwritten
      let decorate = ent => _.assign( {}, ent, { distance: distance(ent) } );
      let decoratedEnts = sortedEnts.map( decorate );

      return decoratedEnts;
    } )
  );
}, LRUCache({ max: AGGREGATE_CACHE_SIZE }) );

const search = q => {
  let { limit, offset } = q;

  return (
    Promise.try( () => searchAll(q) )
    .then( ents => ents.slice( offset, offset + limit ) )
    .catch( err => {
      logger.error(`Aggregate search failed: ${err.toString()}`);

      throw err;
    } )
  );
};

const get = q => {
  let provider = providers.find( p => p.namespace === q.namespace );

  return provider.get( q ).catch( err => {
    logger.error(`Aggregate get failed: ${err.toString()}`);

    throw err;
  } );
};

module.exports = { get, search };
