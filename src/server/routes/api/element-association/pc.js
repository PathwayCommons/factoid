import fetch from 'node-fetch';
import querystring from 'querystring';
import _ from 'lodash';
import { tryPromise } from '../../../../util';

const BASE_URL = 'http://www.pathwaycommons.org/pc2';
const LIMIT = 10;
const TAXON_PREFIX = 'http://identifiers.org/taxonomy/';

const clean = obj => _.omitBy( obj, _.isUndefined );

const organismUriToId = uri => uri == null ? null : uri.substr( TAXON_PREFIX.length );

const searchQuery = opts => clean({ q: opts.name, organism: opts.organism, format: 'json' });

const searchPostprocess = res => {
  return res.searchHit.slice( 0, LIMIT ).map( entry => {
    return {
      type: entry.biopaxClass,
      name: entry.name,
      organism: organismUriToId( entry.organism[0] ),
      namespace: 'pathwaycommons',
      id: entry.uri
    };
  } );
};

const getQuery = opts => clean({ uri: opts.id, format: 'jsonld' });

const getPostprocess = res => {
  let entryIsDescr = entry => entry.comment != null && entry['@type'].toLowerCase().indexOf('reference') >= 0;

  return res['@graph'].filter( entryIsDescr ).map( entry => {
    return {
      namespace: 'pathwaycommons',
      id: entry['@id'],
      description: entry.comment[ entry.comment.length - 1 ]
    };
  } )[0] || {};
};

const request = ( endpt, query ) => {
  let addr = BASE_URL + `/${endpt}?` + querystring.stringify( query );

  return (
    tryPromise( () => fetch( addr ) )
      .then( res => res.json() )
  );
};

export const search = opts => {
  return tryPromise( () => request( 'search', searchQuery(opts) ) ).then( searchPostprocess );
};

export const get = opts => {
  return tryPromise( () => request( 'get', getQuery(opts) ) ).then( getPostprocess );
};
