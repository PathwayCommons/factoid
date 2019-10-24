import Express from 'express';
import _ from 'lodash';
import uuid from 'uuid';
import fetch from 'node-fetch';

import { tryPromise } from '../../../../util';
import sendMail from '../../../email-transport';
import Document from '../../../../model/document';
import db from '../../../db';
import logger from '../../../logger';

import * as provider from './reach';

const ENABLE_TEXTMINING = false;

import { BIOPAX_CONVERTER_URL,
  API_KEY } from '../../../../config';

const http = Express.Router();

let newDoc = ({ docDb, eleDb, id, secret, meta }) => {
  return new Document( _.assign( {}, docDb, {
    factoryOptions: eleDb,
    data: _.assign( {}, { id, secret }, meta )
  } ) );
};

let loadDoc = ({ docDb, eleDb, id }) => {
  let doc = newDoc({ docDb, eleDb, id });

  return doc.load().then( () => doc );
};

let createDoc = ({ docDb, eleDb, secret, meta }) => {
  let doc = newDoc({ docDb, eleDb, secret, meta });

  return doc.create().then( () => doc );
};

let tables = ['document', 'element'];

let loadTable = name => db.accessTable( name );

let loadTables = () => Promise.all( tables.map( loadTable ) ).then( dbInfos => ({
  docDb: dbInfos[0],
  eleDb: dbInfos[1]
}) );

let getDocJson = doc => doc.json();

let fillDoc = ( doc, text ) => {
  if( ENABLE_TEXTMINING ){
    return provider.get( text ).then( res => {
      return doc.fromJson( res );
    } ).then( () => doc );
  } else {
    return Promise.resolve(doc);
  }
};

// run cytoscape layout on server side so that the document looks ok on first open
let runLayout = doc => {
  let run = () => doc.applyLayout();
  let getDoc = () => doc;

  return tryPromise( run ).then( getDoc );
};

// let getReachOutput = text => provider.getRawResponse( text );

let handleResponseError = response => {
  if (!response.ok) {
    throw Error(response.statusText);
  }
  return response;
};

let getBiopaxFromTemplates = templates => {
  return fetch( BIOPAX_CONVERTER_URL + 'json-to-biopax', {
    method: 'POST',
    body: JSON.stringify(templates),
    headers: {
      'Content-Type': 'application/json',
      'Accept':'application/vnd.biopax.rdf+xml' }
  } )
  .then(handleResponseError);
};

let getSbgnFromTemplates = templates => {
  return fetch( BIOPAX_CONVERTER_URL + 'json-to-sbgn', {
    method: 'POST',
    body: JSON.stringify(templates),
    headers: {
      'Content-Type': 'application/json',
      'Accept':'application/xml' }
  } )
    .then(handleResponseError);
};

// Email
http.post('/email', function( req, res, next ){
  let { opts, apiKey } = req.body;

  return (
    tryPromise( () => checkApiKey( apiKey ) )
    .then( () => sendMail( opts ) )
    .then( info => res.json( info ) )
    .catch( next )
  );
});

http.get('/', function( req, res, next ){
  let limit = req.query.limit || 50;
  let offset = req.query.offset || 0;
  let apiKey = req.query.apiKey;

  return (
    tryPromise( () => checkApiKey(apiKey) )
    .then( () => loadTable('document') )
    .then( t => {
      let { table, conn } = t;

      return table.skip(offset).limit(limit).run(conn);
    })
    .then( cursor => cursor.toArray() )
    .then( results => res.json( results ) )
    .catch( next )
  );
});

// get existing doc
http.get('/:id', function( req, res, next ){
  let id = req.params.id;

  ( tryPromise( loadTables )
    .then( json => _.assign( {}, json, { id } ) )
    .then( loadDoc )
    .then( getDocJson )
    .then( json => res.json( json ) )
    .catch( next )
  );
});

const checkApiKey = (apiKey) => {
  if( API_KEY && apiKey != API_KEY ){
    throw new Error(`The specified API key '${apiKey}' is incorrect`);
  }
};

// create new doc
http.post('/', function( req, res, next ){
  let { abstract, text, apiKey } = req.body;
  let meta = _.assign({}, req.body);
  let seedText = [abstract, text].filter(text => text ? true : false).join('\n\n');

  let secret = uuid();

  ( tryPromise( () => checkApiKey(apiKey) )
    .then( loadTables )
    .then( ({ docDb, eleDb }) => createDoc({ docDb, eleDb, secret, meta }) )
    .then( doc => fillDoc( doc, seedText ) )
    .then( runLayout )
    .then( getDocJson )
    .then( json => {
      logger.info(`Created new doc ${json.id}`);

      return json;
    } )
    .then(json => {
      return res.json( json );
    })
    .catch( e => {
      logger.error(`Could not fill doc from text: ${text}`);
      logger.error('Exception thrown :', e.message);
      next( e );
    } )
  );
});

// TODO remove this route as reach should never need to be queried directly
// http.post('/query-reach', function( req, res ){
//   let text = req.body.text;

//   getReachOutput( text )
//   .then( reachRes => reachRes.json() )
//   .then( reachJson => res.json(reachJson) );
// });

http.get('/biopax/:id', function( req, res, next ){
  let id = req.params.id;
  tryPromise( loadTables )
    .then( json => _.assign( {}, json, { id } ) )
    .then( loadDoc )
    .then( doc => doc.toBiopaxTemplates() )
    .then( getBiopaxFromTemplates )
    .then( result => result.text() )
    .then( owl => res.send( owl ))
    .catch( next );
});

http.get('/sbgn/:id', function( req, res, next ){
  let id = req.params.id;
  tryPromise( loadTables )
    .then( json => _.assign( {}, json, { id } ) )
    .then( loadDoc )
    .then( doc => doc.toBiopaxTemplates() )
    .then( getSbgnFromTemplates )
    .then( result => result.text() )
    .then( xml => res.send( xml ))
    .catch( next );
});

http.get('/text/:id', function( req, res, next ){
  let id = req.params.id;
  tryPromise( loadTables )
    .then( json => _.assign( {}, json, { id } ) )
    .then( loadDoc )
    .then( doc => doc.toText() )
    .then( txt => res.send( txt ))
    .catch( next );
});

export default http;
