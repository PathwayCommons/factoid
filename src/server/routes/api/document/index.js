// TODO swagger comment & docs

import Express from 'express';
import _ from 'lodash';
import uuid from 'uuid';
import fetch from 'node-fetch';
import cytosnap from 'cytosnap';
import emailRegex from 'email-regex';
import Twitter from 'twitter';

import { tryPromise, makeStaticStylesheet } from '../../../../util';
import sendMail from '../../../email-transport';
import Document from '../../../../model/document';
import db from '../../../db';
import logger from '../../../logger';
import { makeCyEles } from '../../../../util';
import { getPubmedArticle } from './pubmed';

import { BASE_URL,
  BIOPAX_CONVERTER_URL,
  API_KEY,
  DEMO_ID,
  DEMO_SECRET,
  DOCUMENT_IMAGE_WIDTH,
  DOCUMENT_IMAGE_HEIGHT,
  TWITTER_CONSUMER_KEY,
  TWITTER_CONSUMER_SECRET,
  TWITTER_ACCESS_TOKEN_KEY,
  TWITTER_ACCESS_TOKEN_SECRET,
  DEMO_CAN_BE_SHARED,
  DOCUMENT_IMAGE_PADDING,
  EMAIL_CONTEXT_SIGNUP
 } from '../../../../config';

 const DOCUMENT_STATUS_FIELDS = Document.statusFields();

const http = Express.Router();

const snap = cytosnap({
  puppeteer: {
    args: ['--headless', '--disable-dev-shm-usage', '--no-sandbox', '--disable-setuid-sandbox', '--no-zygote']
  }
});

const snapStartPromise = snap.start();

const startCytosnap = () => snapStartPromise;

const twitterClient = new Twitter({
  consumer_key: TWITTER_CONSUMER_KEY,
  consumer_secret: TWITTER_CONSUMER_SECRET,
  access_token_key: TWITTER_ACCESS_TOKEN_KEY,
  access_token_secret: TWITTER_ACCESS_TOKEN_SECRET,
});

let newDoc = ({ docDb, eleDb, id, secret, provided }) => {
  return new Document( _.assign( {}, docDb, {
    factoryOptions: eleDb,
    data: _.assign( {}, { id, secret, provided } )
  } ) );
};

let loadDoc = ({ docDb, eleDb, id, secret }) => {
  let doc = newDoc({ docDb, eleDb, id, secret });

  return doc.load().then( () => doc );
};

let createSecret = ({ secret }) => {
  return (
    tryPromise( () => loadTable('secret') )
    .then(({ table, conn }) => table.insert({ id: secret }).run(conn))
  );
};

let createDoc = ({ docDb, eleDb, id, secret, provided }) => {
  let doc = newDoc({ docDb, eleDb, id, secret, provided });

  return doc.create().then( () => doc );
};

let tables = ['document', 'element'];

let loadTable = name => db.accessTable( name );

let loadTables = () => Promise.all( tables.map( loadTable ) ).then( dbInfos => ({
  docDb: dbInfos[0],
  eleDb: dbInfos[1]
}) );

let getDocJson = doc => doc.json();

const DEFAULT_CORRESPONDENCE = {
  emails: [],
  context: EMAIL_CONTEXT_SIGNUP
};

const fillDocCorrespondence = async ( doc, authorEmail, isCorrespondingAuthor, context ) => {
  try {
    if( !emailRegex({exact: true}).test( authorEmail ) ) throw new TypeError( `Could not detect an email for '${authorEmail}'` );
    doc.correspondence( _.defaults( { authorEmail, isCorrespondingAuthor, context }, DEFAULT_CORRESPONDENCE ) );
  } catch ( error ){
    doc.issues({ authorEmail: `${error.message}` });
  }
};

const fillDocArticle = async ( doc, paperId ) => {
  try {
    const pubmedRecord = await getPubmedArticle( paperId );
    doc.article( pubmedRecord );
  } catch ( error ){
    doc.issues({ paperId: `${error.message}` });
  }
};

let fillDoc = async ( doc, provided ) => {
  const { paperId, authorEmail, isCorrespondingAuthor, context } = provided;
  fillDocCorrespondence( doc, authorEmail, isCorrespondingAuthor, context );
  await fillDocArticle( doc, paperId );
  return doc;
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
// - status: include docs bearing valid Document 'status'
// - ids: only get the docs for the specified comma-separated list of ids (disables pagination)
http.get('/', function( req, res, next ){
  let { limit, offset, apiKey } = Object.assign({
    limit: 50,
    offset: 0
  }, req.query);

  let ids = req.query.ids ? req.query.ids.split(/\s*,\s*/) : null;

  const status = req.query.status ? req.query.status.split(/\s*,\s*/) : null;

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

      if( status != null ){
        const values =  _.intersection( _.values( DOCUMENT_STATUS_FIELDS ), status );
        let byStatus = r;
        values.forEach( ( value, index ) => {
          if( index == 0 ){
            byStatus = byStatus.row('status').default('unset').eq( value );
          } else {
            byStatus = byStatus.or( r.row('status').default('unset').eq( value ) );
          }
        });

        q = q.filter( byStatus );
      }

      q = ( q
        .filter(r.row('secret').ne(DEMO_SECRET))
        .pluck(['id', 'secret'])
      );

      return q.run(conn);
    })
    .then( cursor => cursor.toArray() )
    .then( res => { // map ids to full doc json
      return Promise.all(res.map(docDbJson => {
        let { id, secret } = docDbJson;
        let docOpts = _.assign( {}, tables, { id, secret } );

        return loadDoc(docOpts).then(getDocJson);
      }));
    } )
    .then( results => res.json( results ) )
    .catch( next )
  );
});

/**
 * Get the JSON for the specified document, with the same format and caveats
 * as the GET /api/document/:id route.
 * @param {*} id The public document ID (UUID).
 */
const getDocumentJson = id => {
  return ( tryPromise( loadTables )
    .then( json => _.assign( {}, json, { id } ) )
    .then( loadDoc )
    .then( getDocJson )
  );
};

// get doc figure as png image
http.get('/(:id).png', function( req, res, next ){
  const id = req.params.id;
  const cyStylesheet = makeStaticStylesheet();
  const imageWidth = DOCUMENT_IMAGE_WIDTH;
  const imageHeight = DOCUMENT_IMAGE_HEIGHT;
  const imagePadding = DOCUMENT_IMAGE_PADDING;

  res.setHeader('content-type', 'image/png');

  const getDoc = id => {
    return ( tryPromise( loadTables )
      .then( json => _.assign( {}, json, { id } ) )
      .then( loadDoc )
    );
  };

  const getElesJson = doc => {
    return makeCyEles(doc.elements());
  };

  const getPngImage = elesJson => {
    return ( startCytosnap()
      .then(() => snap.shot({
        elements: elesJson,
        style: cyStylesheet,
        layout: {
          name: 'preset',
          fit: true,
          padding: imagePadding
        },
        format: 'png',
        resolvesTo: 'stream',
        background: '#fff',
        width: imageWidth,
        height: imageHeight
      }))
    );
  };

  ( tryPromise(() => getDoc(id))
    .then(getElesJson)
    .then(getPngImage)
    .then(stream => stream.pipe(res))
    .catch( next )
  );
});

// tweet a document as a card with a caption (text)
http.post('/:id/tweet', function( req, res, next ){
  const id = req.params.id;
  const { text, secret } = _.assign({ text: '', secret: 'read-only-no-secret-specified' }, req.body);
  const url = `${BASE_URL}/document/${id}`;
  const status = `${text} ${url}`;
  let db;

  ( tryPromise(() => loadTable('document'))
    .then(docDb => {
      db = docDb;

      return db;
    })
    .then(({ table, conn }) => table.get(id).run(conn))
    .then(doc => {
      const docSecret = doc.secret;

      if( !DEMO_CAN_BE_SHARED && id === DEMO_ID ){
        throw new Error(`Tweeting the demo document is forbidden`);
      }

      if( docSecret !== secret ){
        throw new Error(`Can not tweet since the provided secret is incorrect`);
      }
    })
    .then(() => twitterClient.post('statuses/update', { status }))
    .then(tweet => {
      return db.table.get(id).update({ tweet }).run(db.conn).then(() => tweet);
    })
    .then(json => res.json(json))
    .catch(next)
  );
});

// get existing doc as json
http.get('/:id', function( req, res, next ){
  let id = req.params.id;

  ( tryPromise( () => getDocumentJson(id) )
    .then( json => res.json( json ) )
    .catch( next )
  );
});

const checkApiKey = (apiKey) => {
  if( API_KEY && apiKey != API_KEY ){
    throw new Error(`The specified API key '${apiKey}' is incorrect`);
  }
};

// delete the demo doc
http.delete('/:secret', function(req, res, next){
  let secret = req.params.secret;
  let { apiKey } = req.body;

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
  const provided = _.assign( {}, req.body );
  const { paperId } = provided;
  const id = paperId === DEMO_ID ? DEMO_ID: undefined;
  const secret = paperId === DEMO_ID ? DEMO_SECRET: uuid();

  ( tryPromise( () => createSecret({ secret }) )
    .then( loadTables )
    .then( ({ docDb, eleDb }) => createDoc({ docDb, eleDb, id, secret, provided }) )
    .catch( e => { logger.error(`Error creating doc: ${e.message}`); next( e ); })
    .then( doc => doc.request().then( () => doc ) )
    .then( doc => fillDoc( doc, provided ) )
    .then( getDocJson )
    .then( json => res.json( json ) )
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
export { getDocumentJson }; // allow access so page rendering can get the same data as the rest api
