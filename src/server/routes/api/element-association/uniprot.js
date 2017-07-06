const fetch = require('node-fetch');
const Promise = require('bluebird');
const querystring = require('querystring');
const _ = require('lodash');
const Organism = require('../../../../model/organism');

const BASE_URL = 'http://www.uniprot.org/uniprot';
const COLUMNS = 'id,organism-id,entry+name,genes,protein+names';

const isEmpty = str => str == null || str === '';

const notIsEmpty = str => !isEmpty( str );

const clean = obj => _.omitBy( obj, _.isNil );

const param = ( name, value ) => {
  if( value == null ){ return null; }

  if( name === '' ){ return value; }

  return `${name}:${value}`;
};

const searchQuery = opts => clean({
  query: [
    param('accession', opts.id),
    param('', opts.name),
    param('organism', (() => {
      let orgs = opts.organism;
      let ids;

      if( orgs == null || orgs === '' ){
        ids = Organism.ALL.map( org => org.id() );
      } else {
        ids = orgs.split(',');
      }

      return '(' + ids.join('+OR+') + ')';
    })())
  ].filter( p => !_.isNil(p) ).join('+AND+'),
  limit: opts.limit,
  offset: opts.offset,
  sort: 'score',
  format: 'tab',
  columns: COLUMNS
});

const searchPostprocess = res => {
  let lines = res.split(/\n/);
  let ents = [];
  let type = 'protein';
  let namespace = 'uniprot';

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
    // let proteinNames = data[4].split(/\s+\(|\)\s+\(|\)$/).filter( notIsEmpty ); // TODO find a better way to split
    let proteinNames = [ data[4] ];
    let url = BASE_URL + '/' + id;

    ents.push({ namespace, type, id, organism, name, geneNames, proteinNames, url });
  }

  return ents;
};

const getQuery = opts => searchQuery({ id: opts.id });

const getPostprocess = searchPostprocess;

const request = ( endpt, query ) => {
  let addr = BASE_URL + `/${endpt}` + ( query != null ? '?' + querystring.stringify( query ) : '' );

  return (
    Promise
      .try( () => fetch( addr ) )
      .then( res => res.text() )
  );
};

module.exports = {
  search( opts ){
    return Promise.try( () => request( '', searchQuery(opts) ) ).then( searchPostprocess );
  },

  get( opts ){
    return Promise.try( () => request( '', getQuery(opts) ) ).then( getPostprocess );
  }
};
