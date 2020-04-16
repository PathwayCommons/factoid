// TODO swagger comment & docs

import Express from 'express';
import _ from 'lodash';
import uuid from 'uuid';
import fetch from 'node-fetch';
import cytosnap from 'cytosnap';
import Twitter from 'twitter';
import LRUCache from 'lru-cache';
import emailRegex from 'email-regex';

import { tryPromise, makeStaticStylesheet, makeCyEles, msgFactory, updateCorrespondence, EmailError, truncateString } from '../../../../util';
import sendMail from '../../../email-transport';
import Document from '../../../../model/document';
import db from '../../../db';
import logger from '../../../logger';
import { getPubmedArticle } from './pubmed';
import { createPubmedArticle } from '../../../../util/pubmed';
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
  MAX_TWEET_LENGTH,
  DEMO_CAN_BE_SHARED,
  DOCUMENT_IMAGE_PADDING,
  EMAIL_CONTEXT_SIGNUP,
  EMAIL_CONTEXT_JOURNAL,
  EMAIL_TYPE_INVITE,
  DOCUMENT_IMAGE_CACHE_SIZE,
  EMAIL_TYPE_FOLLOWUP
 } from '../../../../config';

import { ENTITY_TYPE } from '../../../../model/element/entity-type';
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

let deleteTableRows = async ( apiKey, secret ) => {
  let clearRows = db => db.table.filter({ secret }).delete().run( db.conn );
  return tryPromise( () => checkApiKey( apiKey ) )
    .then( loadTables )
    .then( ({ docDb, eleDb }) => Promise.all( [ docDb, eleDb ].map( clearRows ) ) );
};

const DEFAULT_CORRESPONDENCE = {
  emails: [],
  context: EMAIL_CONTEXT_SIGNUP
};

/**
 * findEmailAddress
 *
 * Helper method to extract email addresses from strings and address objects supported by [Nodemailer]{@link https://nodemailer.com/message/addresses/}
 * @param {*} address a string, Object, or mixed array of string[], Object[]
 * @returns {*} an array of email addresses, possibly empty
 * @throws {TypeError}
 */
const findEmailAddress = address => {

  const fromString = str => {
    let output = [];
    const addr = str.replace(/,/g, ' ').match( emailRegex() );
    if( addr ) output = addr;
    return output;
  };
  const fromPlainObject = obj => {
    let output = [];
    if( _.has( obj, 'address' ) ) output = _.get( obj, 'address', '' ).match( emailRegex() );
    return output;
  };
  const fromArray = arr => {
    const address = arr.map( elt => {
      if( _.isString( elt ) ){
        return fromString( elt );
      } else if ( _.isPlainObject( elt ) ){
        return fromPlainObject( elt );
      } else {
        return null;
      }
    });
    return _.uniq( _.compact( _.flatten( address ) ) );
  };

  const type = typeof address;
  switch ( type ) {
    case 'string':
      return fromString( address );
    case 'object':
      if( _.isArray( address ) ) {
        return fromArray( address );
      } else if ( _.isPlainObject( address ) ) {
        return fromPlainObject( address );
      } else {
        throw new TypeError('Invalid address');
      }
    default:
      throw new TypeError('Invalid address');
  }
};

const fillDocCorrespondence = async ( doc, authorEmail, context ) => {
  let address = [];
  try {
    address = findEmailAddress( authorEmail );
    if( _.isEmpty( address ) ) throw new EmailError(`Unable to find email for '${authorEmail}'`, authorEmail);
    await doc.issues({ authorEmail: null });
  } catch ( error ){
    await doc.issues({ authorEmail: { error, message: error.message } });
  } finally {
    const emails = _.get( doc.correspondence(), 'emails' );
    const data = _.defaults( { authorEmail: address, context, emails }, DEFAULT_CORRESPONDENCE );
    await doc.correspondence( data );
  }
};

const fillDocArticle = async ( doc, paperId ) => {
  try {
    const pubmedRecord = await getPubmedArticle( paperId );
    await doc.article( pubmedRecord );
    await doc.issues({ paperId: null });
  } catch ( error ) {
    const pubmedRecord = createPubmedArticle({ articleTitle: paperId });
    await doc.article( pubmedRecord );
    await doc.issues({ paperId: { error, message: error.message } });
  }
};

const fillDoc = async doc => {
  const { paperId, authorEmail, context } = doc.provided();
  await fillDocCorrespondence( doc, authorEmail, context );
  await fillDocArticle( doc, paperId );
  return doc;
};

const configureAndSendMail = async ( emailType, id, secret ) => {
  let info;
  const { docDb, eleDb } = await loadTables();
  const doc =  await loadDoc ({ docDb, eleDb, id, secret });

  try {
    const mailOpts =  await msgFactory( emailType, doc );
    info =  await sendMail( mailOpts );

  } catch ( error ) {
    logger.error( `Error sending email: ${error.message}`);
    info = _.assign( {}, { error, date: new Date() });
    throw error;

  } finally {
    await updateCorrespondence( doc, info, emailType );
  }
};

// Do not try send when there are email issues
const hasIssue = ( doc, key ) => _.has( doc.issues(), key ) && !_.isNull( _.get( doc.issues(), key ) );
const sendInviteNotification = async doc => {
  let emailType = EMAIL_TYPE_INVITE;
  const id = doc.id();
  const secret = doc.secret();
  const hasAuthorEmailIssue = hasIssue( doc, 'authorEmail' );
  if( !hasAuthorEmailIssue ) await configureAndSendMail( emailType, id, secret );
  return doc;
};

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

// get all docs
// - offset: pagination offset
// - limit: pagination size limit
// - apiKey: to authorise secret access
// - status: include docs bearing valid Document 'status'
// - ids: only get the docs for the specified comma-separated list of ids (disables pagination)
http.get('/', function( req, res, next ){
  let { limit, offset, apiKey } = Object.assign({
    limit: 50,
    offset: 0
  }, req.query);

  let ids = req.query.ids ? req.query.ids.split(/\s*,\s*/) : null;

  let status;
  if( _.has( req.query, 'status' ) ){
    status = _.compact( req.query.status.split(/\s*,\s*/) );
  }

  let tables;

  return (
    tryPromise( () => loadTables() )
    .then( tbls => {
      tables = tbls;

      return tables;
    } )
    .then( tables => {
      let t = tables.docDb;
      let { table, conn, rethink: r } = t;
      let q = table;

      q = q.orderBy(r.desc('createdDate'));

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

      if( status ){
        const values =  _.intersection( _.values( DOCUMENT_STATUS_FIELDS ), status );
        let byStatus = { foo: true };
        values.forEach( ( value, index ) => {
          if( index == 0 ){
            byStatus = r.row('status').default('unset').eq( value );
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
    .then( res => {
      try {
        checkApiKey(apiKey);

        return { res, haveSecretAccess: true };
      } catch( err ){
        return { res, haveSecretAccess: false };
      }
    } )
    .then( ({res, haveSecretAccess}) => { // map ids to full doc json
      return Promise.all(res.map(docDbJson => {
        let { id } = docDbJson;
        let secret = haveSecretAccess ? docDbJson.secret : undefined;
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

const getDocumentImageBuffer = id => {
  const cyStylesheet = makeStaticStylesheet();
  const imageWidth = DOCUMENT_IMAGE_WIDTH;
  const imageHeight = DOCUMENT_IMAGE_HEIGHT;
  const imagePadding = DOCUMENT_IMAGE_PADDING;

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
        resolvesTo: 'base64',
        background: '#fff',
        width: imageWidth,
        height: imageHeight
      }))
    );
  };

  const convertToBuffer = base64 => Buffer.from(base64, 'base64');

  return ( tryPromise(() => getDoc(id))
    .then(getElesJson)
    .then(getPngImage)
    .then(convertToBuffer)
  );
};

const imageCache = new LRUCache({
  max: DOCUMENT_IMAGE_CACHE_SIZE
});

// get doc figure as png image
http.get('/(:id).png', function( req, res, next ){
  const id = req.params.id;

  res.setHeader('content-type', 'image/png');

  if( imageCache.has(id) ){
    const img = imageCache.get(id);

    res.send(img);
  } else {
    ( tryPromise(() => getDocumentImageBuffer(id))
      .then(buffer => {
        imageCache.set(id, buffer);

        return buffer;
      })
      .then(buffer => res.send(buffer))
      .catch( next )
    );
  }
});

// tweet a document as a card with a caption (text)
const tweetDoc = ( id, secret, text ) => {
  const url = `${BASE_URL}/document/${id}`;
  const status = `${text} ${url}`;
  let db;

  return ( tryPromise(() => loadTable('document'))
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
  );
};

// tweet a document as a card with a caption (text)
http.post('/:id/tweet', function( req, res, next ){
  const id = req.params.id;
  const { text, secret } = _.assign({ text: '', secret: 'read-only-no-secret-specified' }, req.body);

  tweetDoc( id, secret, text )
    .then( json => res.json( json ) )
    .catch( next );
});

http.get('/api-key-verify', function( req, res, next ){
  let apiKey = req.query.apiKey;

  ( tryPromise( () => checkApiKey( apiKey ) )
    .then( () => res.end() )
    .catch( next )
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

const checkRequestContext = async provided => {
  const { apiKey, context } = provided;
  switch ( context ) {
    case EMAIL_CONTEXT_JOURNAL:
      checkApiKey( apiKey );
      break;
    case EMAIL_CONTEXT_SIGNUP:
      break;
    default:
      throw new TypeError(`The specified context '${context}' is not recognized`);
  }
};

http.delete('/:secret', function(req, res, next){
  let secret = req.params.secret;
  let { apiKey } = req.body;
  deleteTableRows( apiKey, secret ).then( () => res.end() ).catch( next );
});

// Attempt to verify; Idempotent
const tryVerify = async doc => {

  if( !doc.verified() ){
    let doVerify = false;
    const { context } = doc.provided();

    if( context && context === EMAIL_CONTEXT_JOURNAL ){
      doVerify = true;

    } else {
      const { authorEmail } = doc.correspondence();
      const { authors: { contacts } } = doc.citation();
      const hasEmail = _.some( contacts, contact => !_.isEmpty( _.intersection( _.get( contact, 'email' ), authorEmail ) ) );
      if( hasEmail ) doVerify = true;
    }
    if( doVerify ) await doc.verified( true );
  }

  return doc;
};

// create new doc
http.post('/', function( req, res, next ){
  const provided = _.assign( {}, req.body );
  const { paperId } = provided;
  const id = paperId === DEMO_ID ? DEMO_ID: undefined;
  const secret = paperId === DEMO_ID ? DEMO_SECRET: uuid();

  const setRequestStatus = doc => tryPromise( () => doc.request() ).then( () => doc );
  const setApprovedStatus = doc => tryPromise( () => doc.approve() ).then( () => doc );
  const handleDocCreation = async ({ docDb, eleDb }) => {
    if( id === DEMO_ID ) await deleteTableRows( API_KEY, secret );
    return await createDoc({ docDb, eleDb, id, secret, provided });
  };
  const sendJSONResponse = doc => tryPromise( () => doc.json() )
  .then( json => res.json( json ) )
  .then( () => doc );

  checkRequestContext( provided )
    .then( () => createSecret({ secret }) )
    .then( loadTables )
    .then( handleDocCreation )
    .then( setRequestStatus )
    .then( fillDoc )
    .then( setApprovedStatus )
    .then( tryVerify )
    .then( sendJSONResponse )
    .then( sendInviteNotification )
    .catch( next );
});

// Email
http.patch('/email/:id/:secret', function( req, res, next ){
  const { id, secret } = req.params;
  const { apiKey, emailType } = req.query;
  return (
    tryPromise( () => checkApiKey( apiKey ) )
    .then( () => configureAndSendMail( emailType, id, secret ) )
    .then( () => res.end() )
    .catch( next )
  );
});

// Update document status
http.patch('/status/:id/:secret', function( req, res, next ){
  const { id, secret } = req.params;

  // Publish criteria: non-empty; all entities complete
  const tryPublish = async doc => {
    let didPublish = false;
    const hasEles = doc => doc.elements().length > 0;
    const hasIncompleteEles = doc => doc.elements().some( ele => !ele.completed() && !ele.isInteraction() && ele.type() !== ENTITY_TYPE.COMPLEX );
    const hasSubmittedStatus = doc => doc.status() === DOCUMENT_STATUS_FIELDS.SUBMITTED;
    const isPublishable = doc => hasEles( doc ) && !hasIncompleteEles( doc ) && hasSubmittedStatus( doc );
    if( isPublishable( doc ) ){
      await doc.publish();
      didPublish = true;
    }
    return didPublish;
  };

  const sendFollowUpNotification = async doc => await configureAndSendMail( EMAIL_TYPE_FOLLOWUP, doc.id(), doc.secret() );
  const tryTweetingDoc = async doc => {
    if ( !doc.hasTweet() ) {
      try {
        let text = truncateString( doc.toText(), MAX_TWEET_LENGTH ); // TODO?
        return tweetDoc( doc.id(), doc.secret(), text );
      } catch ( e ) {
        logger.error( `Error attempting to Tweet: ${JSON.stringify(e)}` ); //swallow
      }
    }
  };
  const handlePublishRequest = async doc => {
    const didPublish = await tryPublish( doc );
    if( didPublish ) {
      await tryTweetingDoc( doc );
      await sendFollowUpNotification( doc );
    }
  };

  const updateDocStatus = async doc => {
    const updates = req.body;
    for( const update of updates ){
      const { op, path, value } = update;
      if( op === 'replace' && path === 'status' ){
        switch ( value ) {
          case DOCUMENT_STATUS_FIELDS.PUBLISHED: {
            await handlePublishRequest( doc );
            break;
          }
          default:
            break;
        }
      }
    }
    return doc;
  };

  return (
    tryPromise( () => loadTables() )
    .then( ({ docDb, eleDb }) => loadDoc ({ docDb, eleDb, id, secret }) )
    .then( updateDocStatus )
    .then( getDocJson )
    .then( json => res.json( json ) )
    .catch( next )
  );
});

// Refresh the document data
http.patch('/:id/:secret', function( req, res, next ){
  const { id, secret } = req.params;
  const { apiKey } = req.query;

  return (
    tryPromise( () => checkApiKey( apiKey ) )
    .then( loadTables )
    .then( ({ docDb, eleDb }) => loadDoc ({ docDb, eleDb, id, secret }) )
    .then( fillDoc )
    .then( tryVerify )
    .then( getDocJson )
    .then( json => res.json( json ) )
    .catch( next )
  );
});

http.get('/biopax/:id', function( req, res, next ){
  let id = req.params.id;
  tryPromise( loadTables )
    .then( json => _.assign( {}, json, { id } ) )
    .then( loadDoc )
    .then( doc => doc.toBiopaxTemplates() )
    .then( getBiopaxFromTemplates )
    .then( result => {
      console.log(result);
      return result;
    } )
    .then( result => result.text() )
    // .then( owl => {
    //   console.log( owl );
    //   return owl;
    // })
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
