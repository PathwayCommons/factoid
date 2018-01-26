const _ = require('lodash');
const Promise = require('bluebird');
const dice = require('dice-coefficient'); // sorensen dice coeff
const distanceMetric = (a, b) => 1 - dice(a, b);
const chebi = require('./chebi');
const uniprot = require('./uniprot');
const providers = [ uniprot, chebi ];
const { memoize } = require('../../../../util');
const LRUCache = require('lru-cache');
const { MAX_SEARCH_SIZE, AGGREGATE_CACHE_SIZE } = require('../../../../config');

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

  let distance = ent => {
    let provider = getProviderByNs( ent.namespace );
    let undef = Number.MAX_SAFE_INTEGER;
    let dist = undef;

    let checkDist = val => {
      let d = val == null ? undef : distanceMetric( searchTerm, val );

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
  };

  return (
    Promise.all( providers.map( p => p.search( q ) ) ).then( entSets => {
      let ents = _.flatten( entSets );
      let sortedEnts = _.sortBy( ents, distance ); // stable sort

      return sortedEnts;
    } )
  );
}, LRUCache({ max: AGGREGATE_CACHE_SIZE }) );

const search = q => {
  let { limit, offset } = q;

  return (
    Promise.try( () => searchAll(q) )
    .then( ents => ents.slice( offset, offset + limit ) )
  );
};

const get = q => {
  let provider = providers.find( p => p.namespace === q.namespace );

  return provider.get( q );
};

module.exports = { get, search };
