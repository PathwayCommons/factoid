// TODO swagger comment & docs

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
  API_KEY,
  DEMO_ID,
  DEMO_SECRET } from '../../../../config';

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

let createSecret = ({ secret }) => {
  return (
    tryPromise( () => loadTable('secret') )
    .then(({ table, conn }) => table.insert({ id: secret }).run(conn))
  );
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

// get all docs
// - offset: pagination offset
// - limit: pagination size limit
// - apiKey: to authorise doc creation
// - submitted: only get submitted docs if true, only get unsubmitted docs if false, no submission filtering on unspecified
// - ids: only get the docs for the specified comma-separated list of ids (disables pagination)
http.get('/', function( req, res, next ){
  let { limit, offset, apiKey, submitted } = Object.assign({
    limit: 50,
    offset: 0
  }, req.query);

  // cast to bool
  submitted = submitted == 'true' ? true : (submitted == 'false' ? false : null);

  let ids = req.query.ids ? req.query.ids.split(/\s*,\s*/) : null;

  let tables;

  return (
    tryPromise( () => checkApiKey(apiKey) )
    .then( loadTables )
    .then( tbls => {
      tables = tbls;

      return tables;
    } )
    .then( tables => {
      let t = tables.docDb;
      let { table, conn, rethink: r } = t;
      let q = table;

      if( ids ){ // doc id must be in specified id list
        let exprs = ids.map(id => r.row('id').eq(id));
        let joinedExpr = exprs[0];

        for( let i = 1; i < exprs.length; i++ ){
          joinedExpr = joinedExpr.or(exprs[i]);
        }

        q = q.filter( joinedExpr );
      } else {
        q = q.skip(offset).limit(limit);
      }

      if( submitted != null ){
        if( submitted ){
          q = q.filter( r.row('submitted').eq(true) );
        } else {
          q = q.filter( r.row('submitted').eq(false) );
        }
      }

      q = ( q
        .filter(r.row('secret').ne(DEMO_SECRET))
        .pluck(['id'])
      );

      return q.run(conn);
    })
    .then( cursor => cursor.toArray() )
    .then( res => { // map ids to full doc json
      const ids = res.map(obj => obj.id);

      return Promise.all(ids.map(id => {
        let docOpts = _.assign( {}, tables, { id } );

        return loadDoc(docOpts).then(getDocJson);
      }));
    } )
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

// create the demo doc
http.post('/demo', function(req, res, next){
  let meta = _.assign({}, req.body, { id: DEMO_ID });
  let secret = DEMO_SECRET;

  ( tryPromise(() => createSecret({ secret }))
    .then(loadTables)
    .then(({ docDb, eleDb }) => createDoc({ docDb, eleDb, secret, meta }))
    .then(getDocJson)
    .then(json => res.json(json))
    .catch(err => next(err))
  );
});

// delete the demo doc
http.delete('/demo', function(req, res, next){
  let { apiKey } = req.body;
  let secret = DEMO_SECRET;

  let clearDemoRows = db => db.table.filter({ secret }).delete().run(db.conn);

  ( tryPromise(() => checkApiKey(apiKey))
    .then(loadTables)
    .then(({ docDb, eleDb }) => (
      Promise.all([docDb, eleDb].map(clearDemoRows))
    ))
    .then(() => res.sendStatus(200))
    .catch(err => next(err))
  );
});

// create new doc
http.post('/', function( req, res, next ){
  let { abstract, text, apiKey } = req.body;
  let meta = _.assign({}, req.body);
  let seedText = [abstract, text].filter(text => text ? true : false).join('\n\n');

  let secret = uuid();

  ( tryPromise( () => checkApiKey(apiKey) )
    .then( () => createSecret({ secret }) )
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
