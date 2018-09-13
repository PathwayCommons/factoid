const soap = require('soap');
const _ = require('lodash');
const { memoize, error, tryPromise } = require('../../../../util');
const LRUCache = require('lru-cache');
const { CHEBI_WSDL_URL, CHEBI_JAVA_PACKAGE, CHEBI_CACHE_SIZE, MAX_SEARCH_SIZE } = require('../../../../config');
const NS = 'chebi';
const TYPE = 'chemical';
const convert = require('./search-string-conversion');
const isNonNil = x => !_.isNil(x);

const mapSynonym = syn => syn.data;

const safeParseFloat = n => n != null ? parseFloat(n) : null;

const safeMap = ( col, mapper ) => col == null ? null : col.map( mapper );

const mapChemical = chem => {
  return _.pickBy( {
    namespace: NS,
    type: TYPE,
    id: chem.chebiId,
    name: chem.chebiAsciiName,
    inchi: chem.inchi,
    inchiKey: chem.inchiKey,
    charge: safeParseFloat( chem.charge ),
    mass: safeParseFloat( chem.mass ),
    monoisotopicMass: safeParseFloat( chem.monoisotopicMass ),
    synonyms: _.concat(
      safeMap( chem.IupacNames, mapSynonym ),
      safeMap( chem.Synonyms, mapSynonym )
    ).filter( isNonNil ),
    formulae: safeMap( chem.Formulae, mapSynonym )
  }, val => val != null );
};

const getClient = memoize( () => {
  return tryPromise( () => soap.createClientAsync( CHEBI_WSDL_URL ) );
}, new Map() );

const liteEntityCache = LRUCache({ max: CHEBI_CACHE_SIZE });

const getLiteEntities = memoize( ( search ) => {
  return (
    tryPromise( getClient )
    .then( client => client.getLiteEntityAsync({
      search: search,
      maximumResults: MAX_SEARCH_SIZE,
      searchCategory: `${CHEBI_JAVA_PACKAGE}.SearchCategory.ALL`,
      Stars: `${CHEBI_JAVA_PACKAGE}.StarsCategory.ALL`
    }) )
    .then( res => _.get(res, ['return', 'ListElement'], []).map( mapChemical ) )
  );
}, liteEntityCache );

const getLiteEntitiesAtOffset = ( search, offset = 0, limit = MAX_SEARCH_SIZE ) => {
  search = convert( search );

  return (
    tryPromise( () => getLiteEntities( search ) )
    .then( liteEnts => liteEnts.slice( offset, offset + limit ) )
  );
};

const completeEntityCache = LRUCache({ max: CHEBI_CACHE_SIZE });

const getCompleteEntity = ( id ) => {
  if( completeEntityCache.has(id) ){
    return completeEntityCache.get(id);
  }

  return (
    tryPromise( getClient )
    .then( client => client.getCompleteEntityAsync({ chebiId: id }) )
    .then( res => {
      if( res == null ){ throw error(`No chemical with ID ${id} found by Chebi`); }
      return res;
    } )
    .then( res => mapChemical( res.return ) )
    .then( chem => {
      completeEntityCache.set( id, chem );

      return chem;
    } )
  );
};

const getCompleteEntityByList = ( ids ) => {
  let rawRequest = ids => (
    tryPromise( getClient )
    .then( client => client.getCompleteEntityByListAsync({ ListOfChEBIIds: ids }) )
    .then( res => _.get(res, ['return'], []).map( mapChemical ) )
  );

  let uncachedIds = ids.filter( id => !completeEntityCache.has(id) );
  let getUncachedEnts = uncachedIds.length === 0 ? () => Promise.resolve([]) : () => rawRequest( uncachedIds );
  let fillCacheWithEnts = chems => chems.forEach( chem => completeEntityCache.set( chem.id, chem ) );
  let getEntsFromCache = () => ids.map( id => completeEntityCache.get(id) );

  return (
    tryPromise( getUncachedEnts )
    .then( fillCacheWithEnts )
    .then( getEntsFromCache )
  );
};

const entHasFormulae = ent => ent.formulae != null && _.isArray( ent.formulae );
const entHasChargeDefined = ent => ent.charge != null;

const search = opts => {
  return (
    tryPromise( () => getLiteEntitiesAtOffset( opts.name || opts.id, opts.offset, opts.limit ) )
    .then( liteEnts => getCompleteEntityByList( liteEnts.map( le => le.id ) ) )
    .then( ents => ents.filter( ent => entHasFormulae(ent) && entHasChargeDefined(ent) ) )
  );
};

const get = opts => {
  return (
    tryPromise( () => getCompleteEntity( opts.id ) )
  );
};

const distanceFields = ['id', 'name', 'synonyms'];

module.exports = { namespace: NS, search, get, distanceFields };
