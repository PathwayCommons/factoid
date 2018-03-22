const fetch = require('node-fetch');
const Promise = require('bluebird');
const querystring = require('querystring');
const _ = require('lodash');
const { memoize, error } = require('../../../../util');
const LRUCache = require('lru-cache');
const convert = require('./search-string-conversion');

const { PUBCHEM_BASE_URL, PUBCHEM_CACHE_SIZE, MAX_SEARCH_SIZE } = require('../../../../config');
const TYPE = 'chemical';
const NAMESPACE = 'pubchem';
const USE_TABLE_QUERY = true; // tends to be faster
const ADD_SYNONYMS = true;
const ALWAYS_USE_FIRST_SYNONYM_AS_NAME = true;

const IUPAC_NAME_LABEL = 'IUPAC Name';
const PREFERRED_NAME = 'Preferred';
const TRADITIONAL_NAME = 'Traditional';
const INCHI_LABEL = 'InChI';
const INCHI_KEY_LABEL = 'InChIKey';
const FORMULA_LABEL = 'Molecular Formula';
const MASS_LABEL = 'Molecular Weight';
const MONOISOTOPIC_MASS_LABEL = 'Weight';
const MONOISOTOPIC_MASS_NAME = 'MonoIsotopic';

const isIupacNameProp = p => p.label === IUPAC_NAME_LABEL;
const isPreferredIupacNameProp = p => isIupacNameProp(p) && p.name === PREFERRED_NAME;
const isTraditionalIupacNameProp = p => isIupacNameProp(p) && p.name === TRADITIONAL_NAME;
const isInchiProp = p => p.label === INCHI_LABEL;
const isInchiKeyProp = p => p.label === INCHI_KEY_LABEL;
const isFormulaProp = p => p.label === FORMULA_LABEL;
const isMassProp = p => p.label === MASS_LABEL;
const isMonoisotopicMassProp = p => p.label === MONOISOTOPIC_MASS_LABEL && p.name === MONOISOTOPIC_MASS_NAME;


const getVals = ( ent, matcher ) => {
  let props = ent.props.filter( prop => matcher(prop.urn) );

  return props.map( p => {
    let val = _.get( p, ['value'] );

    if( val.sval != null ){
      return val.sval;
    } else if( val.fval != null ){
      return val.fval;
    } else {
      return null;
    }
  } );
};

const getVal = ( ent, matcher ) => getVals( ent, matcher )[0];

const titleCase = str => !str ? '' : str[0].toUpperCase() + str.substr(1).toLowerCase();

const processName = name => titleCase( name ? name.replace(/;/g, ' ') : '' );

const processEntry = ent => {
  let names = getVals( ent, isIupacNameProp ).map( processName );
  let tradName = processName( getVal( ent, isTraditionalIupacNameProp ) );
  let prefName = processName( getVal( ent, isPreferredIupacNameProp ) );
  let mainName =  tradName || prefName || names[0];

  return {
    type: TYPE,
    namespace: NAMESPACE,
    id: _.get( ent, ['id', 'id', 'cid'] ),
    name: mainName,
    inchi: getVal( ent, isInchiProp ),
    inchiKey: getVal( ent, isInchiKeyProp ),
    charge: ent.charge,
    mass: getVal( ent, isMassProp ),
    monoisotopicMass: getVal( ent, isMonoisotopicMassProp ),
    synonyms: _.uniq( names ).filter( n => n != mainName ),
    formulae: getVals( ent, isFormulaProp )
  };
};

const processTableEntry = ent => {
  return {
    type: TYPE,
    namespace: NAMESPACE,
    id: ent.CID,
    name: processName( ent.IUPACName ), // pubchem doesn't give nice default names for tab reqs...
    inchi: ent.InChI,
    inchiKey: ent.InChIKey,
    charge: ent.Charge,
    mass: ent.MolecularWeight,
    monoisotopicMass: ent.MonoisotopicMass,
    synonyms: [],
    formulae: [ ent.MolecularFormula ]
  };
};

const searchForAllIds = memoize( search => {
  search = convert( search );

  let url = PUBCHEM_BASE_URL + '/substance/name/' + querystring.escape( search ) + '/cids/json?name_type=word&&listkey_count=' + MAX_SEARCH_SIZE;

  return (
    Promise.try( () => fetch( url ) )
    .then( res => res.json() )
    .then( res => {
      let ents = _.get( res, ['InformationList', 'Information']);
      let hasCid = ent => ent.CID != null;
      let getFirstCid = ent => ent.CID[0];
      let noResults = _.get( res, ['Fault', 'Code'] ) === 'PUGREST.NotFound';

      if( noResults ){
        return [];
      }

      let cids = _.uniq( ents.filter( hasCid ).map( getFirstCid ) );

      return cids;
    } )
    .then( ids => ids.slice( 0, MAX_SEARCH_SIZE ) ) // cut off after limit
  );
}, LRUCache({ max: PUBCHEM_CACHE_SIZE }) );

const entryCache = LRUCache({ max: PUBCHEM_CACHE_SIZE });

const getEntriesById = ( ids ) => {
  let uncachedIds = ids.filter( id => !entryCache.has(id) );
  let useTable = USE_TABLE_QUERY;
  let addSyns = ADD_SYNONYMS;
  let url;

  if( useTable ){
    url = `${PUBCHEM_BASE_URL}/compound/cid/${uncachedIds.join(',')}/property/InChI,InChIKey,IUPACName,MolecularFormula,MolecularWeight,MonoisotopicMass,Charge/json`;
  } else {
    url = `${PUBCHEM_BASE_URL}/compound/cid/${uncachedIds.join(',')}/json`;
  }

  let processEnts;

  if( uncachedIds.length === 0 ){
    processEnts = () => [];
  } else if( useTable ){
    processEnts = res => res.PropertyTable.Properties.map( processTableEntry );
  } else {
    processEnts = res => res.PC_Compounds.map( processEntry );
  }

  let putEntsInCache = ents => ents.forEach( ent => entryCache.set( ent.id, ent ) );
  let getEntsFromCache = () => ids.map( id => entryCache.get(id) );

  let synonyms = new Map();

  let getSynonymsPromise = addSyns && uncachedIds.length > 0 ? (
    Promise.try( () => fetch(`${PUBCHEM_BASE_URL}/compound/cid/${uncachedIds.join(',')}/synonyms/json`) )
    .then( res => res.json() )
    .then( res => res.InformationList.Information )
    .then( list => {
      list.forEach( s => synonyms.set( s.CID, s.Synonym ) );
    } )
  ) : Promise.resolve();

  let storeSynonymsInCache = () => {
    synonyms.forEach( ( syns, id ) => {
      let entry = entryCache.get( id );

      entry.synonyms = (syns || []).map( processName );

      // backup case : use first synonym as main name if main result has no name
      if( entry.synonyms.length > 0 && (ALWAYS_USE_FIRST_SYNONYM_AS_NAME || !entry.name) ){
        entry.name = entry.synonyms[0];
        entry.synonyms.shift();
      }
    } );
  };

  let handleSynonyms = () => {
    return (
      Promise.try( () => getSynonymsPromise )
      .then( storeSynonymsInCache )
    );
  };

  return (
    Promise.try( () => fetch( url ) )
    .then( res => res.json() )
    .then( processEnts )
    .then( putEntsInCache )
    .then( handleSynonyms )
    .then( getEntsFromCache )
  );
};

const get = opts => {
  return (
    Promise.try( () => getEntriesById([ +opts.id ]) )
    .then( ents => ents[0] )
  );
};

const search = opts => {
  let offset = _.get( opts, ['offset'], 0 );
  let limit = _.get( opts, ['limit'], MAX_SEARCH_SIZE );

  return (
    Promise.try( () => searchForAllIds( opts.name || opts.id ) )
    .then( getEntriesById )
    .then( ents => ents.slice( offset, offset + limit ) )
  );
};

const distanceFields = ['id', 'name', 'synonyms'];

module.exports = { namespace: NAMESPACE, get, search, distanceFields };
