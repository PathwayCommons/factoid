const fetch = require('node-fetch');
const Promise = require('bluebird');
const querystring = require('querystring');
const _ = require('lodash');
const Organism = require('../../../../model/organism');
const LRUCache = require('lru-cache');
const { memoize, lazySlice } = require('../../../../util');
const xml = require('xml-js');
const convert = require('./search-string-conversion');

const { UNIPROT_CACHE_SIZE, UNIPROT_URL, MAX_SEARCH_SIZE } = require('../../../../config');
const NS = 'uniprot';
const TYPE = 'protein';
const BASE_URL = UNIPROT_URL;
const COLUMNS = 'id,organism-id,entry+name,genes,protein+names';

const isEmpty = str => str == null || str === '';

const clean = obj => _.omitBy( obj, _.isNil );

const param = ( name, value ) => {
  if( isEmpty(value) || value === '"undefined"' || value === '"null"' ){ return null; }

  if( name === '' ){ return value; }

  let ret = `${name}:${value}`;

  return ret;
};

const strParam = ( name, value ) => {
  if( value == null ){ return null; }

  return param(name, value);
};

const searchQuery = opts => {
  return clean({
    query: [
      '(' + [
        strParam('name', opts.name),
        strParam('gene', opts.name),
        strParam('accession', opts.name),
        strParam('accession', opts.id)
      ].filter( p => !_.isNil(p) ).join('+OR+') + ')',
      (() => {
        let orgs = opts.organism;
        let ids;
        let getStringName = org => `"${org.name()}"`;

        if( orgs == null || orgs === '' ){
          ids = Organism.ALL.map( getStringName );
        } else {
          ids = orgs.split(',').map( Organism.fromId ).map( getStringName );
        }

        return '(' + ids.map( id => param('organism', id, false) ).join('+OR+') + ')';
      })()
    ].filter( p => !_.isNil(p) ).join('+AND+'),
    limit: opts.limit,
    offset: opts.offset,
    sort: 'score',
    format: opts.format,
    columns: opts.format === 'tab' ? COLUMNS : null
  });
};

const getQuery = opts => searchQuery({ id: opts.id, limit: 1, offset: 0 });

const parseProteinNames = str => {
  let lvl = 0;
  let i0 = 0;
  let i;
  let names = [];

  for( i = 0; i < str.length; i++ ){
    if( str[i] === '(' ){
      if( names.length === 0 && lvl === 0 ){
        names.push( str.substring(i0, i - 1) );

        i0 = i - 2;
      }

      lvl++;
    } else if( str[i] === ')' ){
      lvl--;

      if( lvl === 0 ){
        names.push( str.substring(i0 + 3, i) );

        i0 = i;
      }
    }
  }

  if( lvl === 0 && names.length === 0 ){
    names.push( str );
  }

  return names;
};

const processTabDelim = res => {
  let lines = res.split(/\n/);
  let ents = [];
  let type = TYPE;
  let namespace = NS;

  for( let i = 0; i < lines.length; i++ ){
    let line = lines[i];
    let isHeaderLine = i === 0;

    if( isHeaderLine || isEmpty( line ) ){ continue; }

    let data = line.split(/\t/);

    if( data.length < 5 ){
      throw new Error('Uniprot did not return enough data fields on line: ' + line);
    }

    let id = data[0];
    let organism = +data[1];
    let name = data[2];
    let geneNames = data[3].split(/\s+/);
    let proteinNames = parseProteinNames( data[4] );

    ents.push({ namespace, type, id, organism, name, geneNames, proteinNames });
  }

  return ents;
};

const getShortOrFullXmlName = n => _.get(n, ['shortName', '_text']) || _.get(n, ['fullName', '_text']);

const getXmlText = n => _.get(n, ['_text']);

const mapXmlArray = ( arr, mapper ) => {
  if( _.isArray(arr) ){
    return arr.map( mapper );
  } else {
    return [ mapper( arr ) ];
  }
};

const pushIfNonNil = ( arr, val ) => {
  if( val ){
    arr.push( val );
  }
};

const processXml = res => {
  let json = xml.xml2js( res, { compact: true } );
  let ents = [];
  let namespace = NS;
  let type = TYPE;

  let entries = _.get( json, ['uniprot', 'entry'] );

  if( entries == null ){
    return [];
  }

  if( !_.isArray(entries) ){
    entries = [ entries ];
  }

  for( let i = 0; i < entries.length; i++ ){
    let entry = entries[i];

    let id = _.get(entry, ['accession', '_text']) || _.get(entry, ['accession', 0, '_text']);
    let name = _.get(entry, ['name', '_text']);
    let organism = +_.get(entry, ['organism', 'dbReference', '_attributes', 'id']);
    let geneNames = mapXmlArray( _.get(entry, ['gene', 'name']), getXmlText );

    let recFullProteinName = _.get(entry, ['protein', 'recommendedName', 'fullName', '_text']);
    let recShortProteinName = _.get(entry, ['protein', 'recommendedName', 'shortName', '_text']);
    let altProteinNames = mapXmlArray( _.get(entry, ['protein', 'alternativeName']), getShortOrFullXmlName );
    let subProteinNames = mapXmlArray( _.get(entry, ['protein', 'submittedName']), getShortOrFullXmlName );

    let proteinNames = [];
    pushIfNonNil( proteinNames, recShortProteinName );
    pushIfNonNil( proteinNames, recFullProteinName );
    altProteinNames.forEach( name => pushIfNonNil( proteinNames, name ) );
    subProteinNames.forEach( name => pushIfNonNil( proteinNames, name ) );

    ents.push({ namespace, type, id, organism, name, geneNames, proteinNames });
  }

  return ents;
};

const getRequestUrl = ( endpt, query ) => BASE_URL + `/${endpt}` + ( query != null ? '?' + querystring.stringify(query) : '' );

const rawTabDelimRequest = ( endpt, query ) => {
  return (
    Promise
      .try( () => fetch( getRequestUrl( endpt, _.assign({}, query, { format: 'tab' }) ) ) )
      .then( res => res.text() )
      .then( processTabDelim )
  );
};

const rawXmlRequest = ( endpt, query ) => {
  let url = getRequestUrl( endpt, _.assign({}, query, { format: 'xml' }) );

  return (
    Promise
      .try( () => fetch( url ) )
      .then( res => res.text() )
      .then( processXml )
  );
};

const request = memoize( rawXmlRequest, LRUCache({ max: UNIPROT_CACHE_SIZE }) );

const search = opts => {
  let { limit, offset } = opts;

  if( limit == null ){ limit = 3; }

  if( offset == null ){ offset = 0; }

  return (
    Promise.try( () => request( '', searchQuery( _.assign({}, opts, {
      name: convert( opts.name ),
      offset: 0,
      limit: MAX_SEARCH_SIZE
    }) ) ) )
    .then( ents => lazySlice( ents, offset, offset + limit ) )
    .catch( () => [] )
  );
};

const get = opts => {
  return (
    Promise.try( () => request( '', getQuery(opts) ) )
    .then( res => res[0] )
  );
};

const distanceFields = ['name', 'id', 'geneNames', 'proteinNames'];

module.exports = { namespace: 'uniprot', search, get, distanceFields };
