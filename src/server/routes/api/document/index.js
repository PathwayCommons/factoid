const http = require('express').Router();
const Promise = require('bluebird');
const _ = require('lodash');
const uuid = require('uuid');


const Document = require('../../../../model/document');
const db = require('../../../db');
const logger = require('../../../logger');

const provider = require('./reach');

let newDoc = ({ docDb, eleDb, id, secret }) => {
  return new Document( _.assign( {}, docDb, {
    factoryOptions: eleDb,
    data: _.defaults( {}, { id, secret } )
  } ) );
};

let loadDoc = ({ docDb, eleDb, id }) => {
  let doc = newDoc({ docDb, eleDb, id });

  return doc.load().then( () => doc );
};

let createDoc = ({ docDb, eleDb, secret }) => {
  let doc = newDoc({ docDb, eleDb, secret });

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
  return provider.get( text ).then( res => {
    return doc.fromJson( res );
  } ).then( () => doc );
};

// run cytoscape layout on server side so that the document looks ok on first open
let runLayout = doc => {
  let run = () => doc.applyLayout();
  let getDoc = () => doc;

  return Promise.try( run ).then( getDoc );
};

let getReachOutput = text => provider.getRawResponse( text );

// get existing doc
http.get('/:id', function( req, res ){
  let id = req.params.id;

  ( Promise.try( loadTables )
    .then( json => _.assign( {}, json, { id } ) )
    .then( loadDoc )
    .then( getDocJson )
    .then( json => res.json( json ) )
  );
});

// create new doc
http.post('/', function( req, res ){
  let text = req.body.text;
  let secret = uuid();

  ( Promise.try( loadTables )
    .then( ({ docDb, eleDb }) => createDoc({ docDb, eleDb, secret }) )
    .then( doc => fillDoc( doc, text ) )
    .then( runLayout )
    .then( getDocJson )
    .then( json => {
      logger.info(`Created new doc ${json.id}`);
      return res.json( json );
    } )
    .catch( e => {
      logger.error(`Could not fill doc from text: ${text}`);
      logger.error('REACH exception thrown :', e.message);
      res.sendStatus(500);

      throw e;
    } )
  );
});

// TODO remove this route as reach should never need to be queried directly
http.post('/query-reach', function( req, res ){
  let text = req.body.text;

  getReachOutput( text )
  .then( reachRes => reachRes.json() )
  .then( reachJson => res.json(reachJson) );
});

module.exports = http;
