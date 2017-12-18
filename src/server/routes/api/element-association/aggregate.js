const _ = require('lodash');
const Promise = require('bluebird');
const dice = require('dice-coefficient'); // sorensen dice coeff
const distanceMetric = (a, b) => 1 - dice(a, b);
const chebi = require('./chebi');
const uniprot = require('./uniprot');
const pubchem = require('./pubchem');
const providers = [ uniprot, chebi ];
const { memoize } = require('../../../../util');
const LRUCache = require('lru-cache');
const { MAX_SEARCH_SIZE, AGGREGATE_CACHE_SIZE } = require('../../../../config');

const searchAll = memoize( q => {
  let allQ = _.assign({}, q, {
    limit: MAX_SEARCH_SIZE,
    offset: 0
  });

  let searchTerm = q.name || q.id;

  let providersByEnts = new Map();

  let distance = ent => {
    let provider = providersByEnts.get( ent.id );
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
    Promise.all( providers.map( p => (
      p.search( allQ )
      .then( ents => {
        ents.forEach( ent => providersByEnts.set(ent.id, p) );

        return ents;
      })
    ) ) ).then( entSets => {
      let ents = _.flatten( entSets );

      return _.sortBy( ents, distance ); // stable sort
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
