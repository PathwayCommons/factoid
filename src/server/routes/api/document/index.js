// TODO swagger comment & docs

import Express from 'express';
import _ from 'lodash';
import uuid from 'uuid';
import fetch from 'node-fetch';
import cytosnap from 'cytosnap';
import Twitter from 'twitter';
import LRUCache from 'lru-cache';
import emailRegex from 'email-regex';
// import url from 'url';
import fs from 'fs';

import { exportToZip, EXPORT_TYPES } from './export';
import { tryPromise, makeStaticStylesheet, makeCyEles, msgFactory, updateCorrespondence, EmailError, truncateString } from '../../../../util';
import sendMail from '../../../email-transport';
import Document from '../../../../model/document';
import db from '../../../db';
import logger from '../../../logger';
import { getPubmedArticle } from './pubmed';
import { createPubmedArticle, getPubmedCitation } from '../../../../util/pubmed';
import * as indra from './indra';
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
  EMAIL_TYPE_INVITE,
  DOCUMENT_IMAGE_CACHE_SIZE,
  EMAIL_TYPE_FOLLOWUP,
  MIN_RELATED_PAPERS,
  SEMANTIC_SEARCH_LIMIT
 } from '../../../../config';

import { ENTITY_TYPE } from '../../../../model/element/entity-type';
import { db2pubmed } from './pubmed/linkPubmed';
import { fetchPubmed } from './pubmed/fetchPubmed';
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

// let createRelatedPapers = ({ papersData, doc }) => {
//   let sanitize = o => {
//     delete o.intnId;
//   };

//   let els = [];
//   papersData.forEach( paperData => {
//     let pmid = paperData.pmid;
//     let pubmed = paperData.pubmed;
//     paperData.elements.forEach( el => {
//       els.push( _.extend( {}, el, { pmid, pubmed } ) );
//     } );
//   } );

//   let papersByEl = {};
//   let pubmedByPmid = {};

//   papersData.map( paperData => {
//     let { pmid, pubmed, elements } = paperData;

//     if ( pubmedByPmid[ pmid ] == undefined ) {
//       pubmedByPmid[ pmid ] = pubmed;
//     }

//     elements.forEach( el => {
//       let elId = el.elId;
//       if ( papersByEl[ elId ] == undefined ) {
//         papersByEl[ elId ] = {};
//       }

//       if ( papersByEl[ elId ][ pmid ] == undefined ) {
//         papersByEl[ elId ][ pmid ] = [];
//       }

//       sanitize( el );
//       papersByEl[ elId ][ pmid ].push( el );
//     } );
//   } );

//   let elPromises = Object.keys( papersByEl ).map( elId => {
//     let elPapersData = papersByEl[ elId ];
//     let pmids = Object.keys( elPapersData );

//     elPapersData = pmids.map( pmid => {
//       let pubmed = pubmedByPmid[ pmid ];
//       let elements = elPapersData[ pmid ];
//       return { pmid, pubmed, elements };
//     } );

//     return doc.get( elId ).relatedPapers( elPapersData );
//   } );

//   let docPromise = doc.relatedPapers( papersData );

//   return Promise.all( [ docPromise, ...elPromises ] );
// };

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
  emails: []
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

const fillDocCorrespondence = async doc => {
  let address = [];
  const { authorEmail } = doc.provided();
  try {
    address = findEmailAddress( authorEmail );
    if( _.isEmpty( address ) ) throw new EmailError(`Unable to find email for '${authorEmail}'`, authorEmail);
    await doc.issues({ authorEmail: null });
  } catch ( error ){
    await doc.issues({ authorEmail: { error, message: error.message } });
    logger.error( `Error filling doc correspondence` );
    logger.error( error );
  } finally {
    const emails = _.get( doc.correspondence(), 'emails' );
    const data = _.defaults( { authorEmail: address, emails }, DEFAULT_CORRESPONDENCE );
    await doc.correspondence( data );
  }
};

const fillDocArticle = async doc => {
  const { paperId } = doc.provided();
  try {
    const pubmedRecord = await getPubmedArticle( paperId );
    await doc.article( pubmedRecord );
    await doc.issues({ paperId: null });
  } catch ( error ) {
    logger.error( `Error filling doc article` );
    logger.error( error );
    const pubmedRecord = createPubmedArticle({ articleTitle: paperId });
    await doc.article( pubmedRecord );
    await doc.issues({ paperId: { error, message: error.message } });
  } finally {
    getRelPprsForDoc( doc );
  }
};

const fillDoc = async doc => {
  await fillDocCorrespondence( doc );
  await fillDocArticle( doc );
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

/**
 * @swagger
 *
 * /api/document/zip:
 *   get:
 *     description: Download a single zip file containing every Document represented in JSON, Systems Biology Graphical Notation Markup Language (SBGNML) and Biological Pathway Exchange (BioPAX).
 *     summary: Zip file of every Document in several file formats.
 *     tags:
 *       - Document
 *     responses:
 *      '200':
 *        description: OK
 *        content:
 *          application/zip:
 *             description: Download a zip file containing each Document in various file formats.
 */
http.get('/zip', function( req, res, next ){
  let filePath = 'download/factoid_bulk.zip';

  const lazyExport = () => {
    let recreate = true;
    if ( fs.existsSync( filePath ) ) {
      const DAY_TO_MS = 86400000;

      let now = Date.now();
      let fileDate = fs.statSync(filePath).birthtimeMs;

      if ( now - fileDate < DAY_TO_MS ) {
        recreate = false;
      }
    }

    if ( recreate ) {
      let addr = req.protocol + '://' + req.get('host');
      return exportToZip(addr, filePath);
    }

    return Promise.resolve();
  };

  tryPromise( lazyExport )
    .then( () => res.download( filePath ))
    .catch( next );
});

/**
 * @swagger
 *
 * /api/document/zip/biopax:
 *   get:
 *     description: Download a single zip file containing every Document represented in Biological Pathway Exchange (BioPAX).
 *     summary: Zip file of every Document represented as BioPAX in owl file format.
 *     tags:
 *       - Document
 *     responses:
 *      '200':
 *        description: OK
 *        content:
 *          application/zip:
 *             description: Download a zip file containing each Document represented as BioPAX in owl file format.
 */
http.get('/zip/biopax', function( req, res, next ){
  let filePath = 'download/factoid_biopax.zip';

  const lazyExport = () => {
    let recreate = true;
    if ( fs.existsSync( filePath ) ) {
      const DAY_TO_MS = 86400000;

      let now = Date.now();
      let fileDate = fs.statSync(filePath).birthtimeMs;

      if ( now - fileDate < DAY_TO_MS ) {
        recreate = false;
      }
    }

    if ( recreate ) {
      let addr = req.protocol + '://' + req.get('host');
      return exportToZip(addr, filePath, [ EXPORT_TYPES.BP ]);
    }

    return Promise.resolve();
  };

  tryPromise( lazyExport )
    .then( () => res.download( filePath ))
    .catch( next );
});

/**
 * @swagger
 *
 * components:
 *
 *   securitySchemes:
 *     ApiKeyAuth:
 *       type: apiKey
 *       description: API key to authorize requests.
 *       in: query
 *       name: apiKey
 *
 *   emailType:
 *     type: string
 *     enum:
 *       - invite
 *       - followUp
 *       - requestIssue
 *
 *   entry:
 *     properties:
 *       id:
 *         type: string
 *       group:
 *         type: string
 *         enum:
 *           - negative
 *           - positive
 *
 *   entity-association:
 *     properties:
 *       id:
 *         type: string
 *
 *   Entity:
 *     properties:
 *       id:
 *         type: string
 *       secret:
 *         type: string
 *       position:
 *         type: object
 *         properties:
 *           x:
 *             type: number
 *           y:
 *             type: number
 *       description:
 *         type: string
 *       name:
 *         type: string
 *       'type':
 *         type: string
 *         enum:
 *           - chemical
 *           - ggp
 *           - DNA
 *           - RNA
 *           - protein
 *           - complex
 *       completed:
 *         type: boolean
 *       association:
 *         type: object
 *         description: Specific to data provider
 *
 *   Interaction:
 *     properties:
 *       id:
 *         type: string
 *       secret:
 *         type: string
 *       position:
 *         type: object
 *         properties:
 *           x:
 *             type: number
 *           y:
 *             type: number
 *       description:
 *         type: string
 *       name:
 *         type: string
 *       'type':
 *         type: string
 *         enum:
 *           - binding
 *           - transcription-translation
 *           - modification
 *           - phosphorylation
 *           - (de)phosphorylation
 *           - ubiquitination
 *           - (de)ubiquitination
 *           - methlyation
 *           - (de)methlyation
 *           - interaction
 *       completed:
 *         type: boolean
 *       association:
 *         type: string
 *         enum:
 *           - binding
 *           - transcription-translation
 *           - modification
 *           - phosphorylation
 *           - (de)phosphorylation
 *           - ubiquitination
 *           - (de)ubiquitination
 *           - methlyation
 *           - (de)methlyation
 *           - interaction
 *       entries:
 *         type: array
 *         items:
 *           $ref: '#/components/entry'
 *
 *   Organism:
 *     properties:
 *       id:
 *         type: string
 *       name:
 *         type: string
 *
 *   Affiliation:
 *     properties:
 *       Affiliation:
 *         type: string
 *       email:
 *         type: array
 *         items:
 *           type: string
 *
 *   Author:
 *     properties:
 *       AffiliationInfo:
 *         type: array
 *         items:
 *           $ref: '#/components/Affiliation'
 *       LastName:
 *         type: string
 *       ForeName:
 *         type: string
 *       Initials:
 *         type: string
 *       CollectiveName:
 *         type: string
 *
 *   ArticleId:
 *     properties:
 *       IdType:
 *         type: string
 *       id:
 *         type: string
 *
 *   ArticleIdList:
 *     type: array
 *     items:
 *       $ref: '#/components/ArticleId'
 *
 *   Journal:
 *     properties:
 *       ISOAbbreviation:
 *         type: string
 *       ISSN:
 *         type: string
 *       Title:
 *         type: string
 *       JournalIssue:
 *         type: object
 *         properties:
 *           Issue:
 *             type: string
 *           PubDate:
 *             type: object
 *             properties:
 *               Year:
 *                 type: string
 *               Month:
 *                 type: string
 *               Day:
 *                 type: string
 *               Season:
 *                 type: string
 *               MedlineDate:
 *                 type: string
 *           Volume:
 *             type: string
 *
 *   citation:
 *     properties:
 *       title:
 *         type: string
 *       authors:
 *         type: object
 *         properties:
 *           abbreviation:
 *             type: string
 *           contacts:
 *             type: array
 *             items:
 *               type: string
 *               description: Email
 *           authorList:
 *             type: array
 *             items:
 *               type: object
 *               properties:
 *                 name:
 *                   type: string
 *                 abbrevName:
 *                   type: string
 *                 isCollectiveName:
 *                   type: boolean
 *       reference:
 *         type: string
 *       abstract:
 *         type: string
 *       pmid:
 *         type: string
 *       doi:
 *         type: string
 *
 *   article:
 *     properties:
 *       MedlineCitation:
 *         type: object
 *         properties:
 *           Article:
 *             type: object
 *             properties:
 *               Abstract:
 *                 type: string
 *               ArticleTitle:
 *                 type: string
 *               AuthorList:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/Author'
 *               Journal:
 *                 $ref: '#/components/Journal'
 *           ChemicalList:
 *             type: array
 *             items:
 *               type: object
 *               properties:
 *                 NameOfSubstance:
 *                   type: String
 *                 RegistryNumber:
 *                   type: String
 *                 UI:
 *                   type: String
 *           InvestigatorList:
 *             type: array
 *             items:
 *               $ref: '#/components/Author'
 *           KeywordList:
 *             type: array
 *             items:
 *               type: string
 *           MeshheadingList:
 *             type: array
 *             items:
 *               type: object
 *               properties:
 *                 DescriptorName:
 *                   type: string
 *                 isMajorTopicYN:
 *                   type: boolean
 *                 UI:
 *                   type: String
 *       PubmedData:
 *         type: object
 *         properties:
 *           ArticleIdList:
 *              $ref: '#/components/ArticleIdList'
 *           History:
 *             type: array
 *             items:
 *               type: object
 *               properties:
 *                 PubStatus:
 *                   type: string
 *                 PubMedPubDate:
 *                   type: object
 *                   properties:
 *                     Year:
 *                       type: string
 *                     Month:
 *                       type: string
 *                     Day:
 *                       type: string
 *           ReferenceList:
 *             type: object
 *             properties:
 *               ArticleIdList:
 *                 $ref: '#/components/ArticleIdList'
 *               Citation:
 *                 type: string
 *
 *   status:
 *     type: string
 *     enum:
 *       - requested
 *       - approved
 *       - submitted
 *       - published
 *       - trashed
 *
 *   Document:
 *     properties:
 *       id:
 *         type: string
 *       secret:
 *         type: string
 *       organisms:
 *         type: array
 *         items:
 *           type: string
 *           description: Organism ID
 *       elements:
 *         type: array
 *         items:
 *           anyOf:
 *             - $ref: '#/components/Entity'
 *             - $ref: '#/components/Interaction'
 *       publicUrl:
 *         type: string
 *       privateUrl:
 *         type: string
 *       citation:
 *         $ref: '#/components/citation'
 *       article:
 *         $ref: '#/components/article'
 *       createdDate:
 *         type: string
 *       lastEditedDate:
 *         type: string
 *       status:
 *         type: string
 *       verified:
 *         type: boolean
 *
 *   responses:
 *     '200':
 *       description: Success
 *     '500':
 *       description: Error
 *     'Bad ID':
 *       description: No response from database for ID
 */

/**
 * @swagger
 *
 * /api/document:
 *   get:
 *     security:
 *       - ApiKeyAuth: []
 *     description: Retrieve Documents
 *     summary: Filter and retrieve a list of paginated Documents
 *     tags:
 *       - Document
 *     parameters:
 *       - name: limit
 *         in: query
 *         description: Pagination size limit
 *         required: false
 *         type: number
 *         allowEmptyValue: true
 *       - name: offset
 *         in: query
 *         description: Pagination start index
 *         required: false
 *         type: number
 *         allowEmptyValue: true
 *       - name: ids
 *         in: query
 *         description: Document IDs (comma-delimited)
 *         summary: Accepts a comma-separated list of doc ids. Disables pagination when used.
 *         required: false
 *         schema:
 *           type: string
 *         allowEmptyValue: true
 *       - name: status
 *         in: query
 *         description: Documents status
 *         summary: Accepts one of the pre-defined statuses
 *         required: false
 *         schema:
 *           $ref: '#/components/status'
 *         allowEmptyValue: true
 *     responses:
 *       '200':
 *         description: ok
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/Document'
 */
http.get('/', function( req, res, next ){
  let limit = _.toInteger( _.get( req.query, 'limit', 50 ) );
  let offset = _.toInteger( _.get( req.query, 'offset', 0 ) );
  let apiKey = _.get( req.query, 'apiKey' );

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

      q = q.filter(r.row('secret').ne(DEMO_SECRET));
      q = q.orderBy(r.desc('createdDate'));

      if( ids ){ // doc id must be in specified id list
        let exprs = ids.map(id => r.row('id').eq(id));
        let joinedExpr = exprs[0];

        for( let i = 1; i < exprs.length; i++ ){
          joinedExpr = joinedExpr.or(exprs[i]);
        }

        q = q.filter( joinedExpr );
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

      if( !ids ){
        q = q.skip(offset).limit(limit);
      }

      q = q.pluck(['id', 'secret']);

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

/**
 * @swagger
 *
 * /api/document/{id}.png:
 *   get:
 *     description: Retrieve a PNG of the Document's interactions
 *     summary: Retrieve an image displaying Document interactions
 *     tags:
 *       - Document
 *     parameters:
 *       - name: id
 *         description: Document ID
 *         summary: Document ID
 *         in: path
 *         required: true
 *     responses:
 *       '200':
 *         description: ok
 *         content:
 *           image/png:
 *             type: string
 *             format: binary
 *       '500':
 *         $ref: '#/components/responses/Bad ID'
 */
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

/**
 * @swagger
 *
 * /api/document/{id}/tweet:
 *   post:
 *     description: Tweet a Document as a card provided text serving as the caption
 *     summary: Tweet a Document as a card
 *     tags:
 *       - Document
*     parameters:
 *       - name: id
 *         description: Document ID
 *         summary: Document ID
 *         in: path
 *         required: true
 *     requestBody:
 *       description: Data used in creating Tweet
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               secret:
 *                 type: string
 *                 description: Document secret
 *               text:
 *                 type: string
 *                 description: Text to be included in Tweet body
 *                 default: The auto-generated text output (see text/{id})
 *     responses:
 *       '200':
 *         description: ok
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       '500':
 *         description: Error
 */
http.post('/:id/tweet', function( req, res, next ){
  const id = req.params.id;
  const { text, secret } = _.assign({ text: '', secret: 'read-only-no-secret-specified' }, req.body);

  tweetDoc( id, secret, text )
    .then( json => res.json( json ) )
    .catch( next );
});


/**
 * @swagger
 *
 * /api/document/api-key-verify:
 *   get:
 *     description: Verify an API key
 *     summary: Verify an API key by the HTTP status
 *     tags:
 *       - Document
 *     parameters:
 *       - name: apiKey
 *         in: query
 *         description: API key
 *         required: true
 *         type: string
 *         allowEmptyValue: true
 *     responses:
 *       '200':
 *         $ref: '#/components/responses/200'
 *       '500':
 *         description: Invalid API key
 */
http.get('/api-key-verify', function( req, res, next ){
  let apiKey = req.query.apiKey;

  ( tryPromise( () => checkApiKey( apiKey ) )
    .then( () => res.end() )
    .catch( next )
  );
});

/**
 * @swagger
 *
 * /api/document/{id}:
 *   get:
 *     description: Retrieve a single Document by ID
 *     summary: Retrieve a single Document by ID
 *     tags:
 *       - Document
 *     parameters:
 *       - name: id
 *         description: Document ID
 *         summary: Document ID
 *         in: path
 *         required: true
 *     responses:
 *       '200':
 *         description: ok
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/Document'
 *       '500':
 *         $ref: '#/components/responses/Bad ID'
 */
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

/**
 * @swagger
 *
 * /api/document/{secret}:
 *   delete:
 *     security:
 *       - ApiKeyAuth: []
 *     description: Delete an existing Document
 *     summary: Delete an existing Document
 *     tags:
 *       - Document
 *     parameters:
 *       - name: secret
 *         in: path
 *         description: Document secret
 *         required: true
 *         type: string
 *     responses:
 *       '200':
 *         $ref: '#/components/responses/200'
 *       '500':
 *         $ref: '#/components/responses/500'
 */
http.delete('/:secret', function(req, res, next){
  let secret = req.params.secret;
  let { apiKey } = req.query;
  deleteTableRows( apiKey, secret ).then( () => res.end() ).catch( next );
});

// Attempt to verify; Idempotent
const tryVerify = async doc => {

  if( !doc.verified() ){
    let doVerify = false;

    const { authorEmail } = doc.correspondence();
    const { authors: { contacts } } = doc.citation();
    const hasEmail = _.some( contacts, contact => !_.isEmpty( _.intersection( _.get( contact, 'email' ), authorEmail ) ) );
    if( hasEmail ) doVerify = true;

    if( doVerify ) await doc.verified( true );
  }

  return doc;
};

/**
 * @swagger
 *
 * /api/document:
 *   post:
 *     description: Create a Document
 *     summary: Create a Document
 *     tags:
 *       - Document
 *     requestBody:
 *       description: Data to create a Document
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               paperId:
 *                 type: string
 *               authorEmail:
 *                 type: string
 *     responses:
 *       '200':
 *         description: ok
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/Document'
 *       '500':
 *         description: Error
 */
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

  tryPromise( () => createSecret({ secret }) )
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

/**
 * @swagger
 *
 * /api/document/email/{id}/{secret}:
 *   post:
 *     security:
 *       - ApiKeyAuth: []
 *     description: Send email to author(s) associated with a Document
 *     summary: Send email to author(s) associated with a Document
 *     tags:
 *       - Document
 *     parameters:
 *       - name: id
 *         in: path
 *         description: Document id
 *         required: true
 *         type: string
 *       - name: secret
 *         in: path
 *         description: Document secret
 *         required: true
 *         type: string
 *       - name: emailType
 *         in: query
 *         description: Type of email
 *         required: true
 *         schema:
 *           $ref: '#/components/emailType'
 *     responses:
 *       '200':
 *         $ref: '#/components/responses/200'
 *       '500':
 *         $ref: '#/components/responses/500'
 */
http.post('/email/:id/:secret', function( req, res, next ){
  const { id, secret } = req.params;
  const { apiKey, emailType } = req.query;
  return (
    tryPromise( () => checkApiKey( apiKey ) )
    .then( () => configureAndSendMail( emailType, id, secret ) )
    .then( () => res.end() )
    .catch( next )
  );
});

/**
 * @swagger
 *
 * /api/document/{id}/{secret}:
 *   patch:
 *     description: Update Document
 *     summary: Update Document related to user-provided data (status, article, correspondence)
 *     tags:
 *       - Document
 *     parameters:
 *       - name: id
 *         in: path
 *         description: Document id
 *         required: true
 *         type: string
 *       - name: secret
 *         in: path
 *         description: Document secret
 *         required: true
 *         type: string
 *     requestBody:
 *       description: Data to update status
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               type: object
 *               properties:
 *                 op:
 *                   type: string
 *                   enum:
 *                     - replace
 *                   required: true
 *                 path:
 *                   type: string
 *                   enum:
 *                     - status
 *                   required: true
 *                 value:
 *                   $ref: '#/components/status'
 *     responses:
 *       '200':
 *         description: ok
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/Document'
 *       '500':
 *         $ref: '#/components/responses/500'
 */
http.patch('/:id/:secret', function( req, res, next ){
  const { id, secret } = req.params;

  // Publish criteria: non-empty; all entities complete
  const tryPublish = async doc => {
    let didPublish = false;
    const hasEles = doc => doc.elements().length > 0;
    const hasIncompleteEles = doc => doc.elements().some( ele => !ele.completed() && !ele.isInteraction() && ele.type() !== ENTITY_TYPE.COMPLEX );
    const isPublishable = doc => hasEles( doc ) && !hasIncompleteEles( doc );
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
        return await tweetDoc( doc.id(), doc.secret(), text );
      } catch ( e ) {
        logger.error( `Error attempting to Tweet: ${JSON.stringify(e)}` ); //swallow
      }
    }
  };
  const handlePublishRequest = async doc => {
    const didPublish = await tryPublish( doc );
    if( didPublish ) {
      updateRelatedPapers( doc );
      await tryTweetingDoc( doc );
      sendFollowUpNotification( doc );
    }
  };

  const updateRelatedPapers = doc => {
    let docId = doc.id();
    logger.info('Searching the related papers table for document ', docId);

    getRelatedPapers( doc )
      .then( () => logger.info('Related papers table is updated for document', docId) )
      .catch( e => logger.error( `Error in uploading related papers for document ${docId}: ${JSON.stringify(e.message)}` ) );

  };

  const updateDoc = async doc => {
    const updates = req.body;
    for( const update of updates ){
      const { op, path, value } = update;

      switch ( path ) {
        case 'status':
          if( op === 'replace' && value === DOCUMENT_STATUS_FIELDS.PUBLISHED ) await handlePublishRequest( doc );
          break;
        case 'article':
          if( op === 'replace' ) await fillDocArticle( doc );
          break;
        case 'correspondence':
          if( op === 'replace' ){
            await fillDocCorrespondence( doc );
            await tryVerify( doc );
          }
          break;
      }

    }
    return doc;
  };

  return (
    tryPromise( () => loadTables() )
    .then( ({ docDb, eleDb }) => loadDoc ({ docDb, eleDb, id, secret }) )
    .then( updateDoc )
    .then( getDocJson )
    .then( json => res.json( json ) )
    .catch( next )
  );
});

/**
 * @swagger
 *
 * /api/document/biopax/{id}:
 *   get:
 *     description: Retrieve a single Document in BioPAX format
 *     summary: Retrieve a single Document in BioPAX format
 *     tags:
 *       - Document
 *     parameters:
 *       - name: id
 *         description: Document ID
 *         summary: Document ID
 *         in: path
 *         required: true
 *     responses:
 *       '200':
 *         description: ok
 *         content:
 *           application/vnd.biopax.rdf+xml:
 *             description: Retrieve Document in BioPAX format (http://www.biopax.org/)
 *       '500':
 *         $ref: '#/components/responses/Bad ID'
 */
http.get('/biopax/:id', function( req, res, next ){
  let id = req.params.id;
  tryPromise( loadTables )
    .then( json => _.assign( {}, json, { id } ) )
    .then( loadDoc )
    .then( doc => doc.toBiopaxTemplate() )
    .then( getBiopaxFromTemplates )
    .then( result => result.text() )
    .then( owl => res.send( owl ))
    .catch( next );
});

/**
 * @swagger
 *
 * /api/document/sbgn/{id}:
 *   get:
 *     description: Retrieve a single Document in SBGN-ML format
 *     summary: Retrieve a single Document in SBGN-ML format
 *     tags:
 *       - Document
 *     parameters:
 *       - name: id
 *         description: Document ID
 *         summary: Document ID
 *         in: path
 *         required: true
 *     responses:
 *       '200':
 *         description: ok
 *         content:
 *           application/xml:
 *             description: Retrieve Document in SBGN-ML format (https://github.com/sbgn/sbgn/wiki/SBGN_ML)
 *       '500':
 *         $ref: '#/components/responses/Bad ID'
 */
http.get('/sbgn/:id', function( req, res, next ){
  let id = req.params.id;
  tryPromise( loadTables )
    .then( json => _.assign( {}, json, { id } ) )
    .then( loadDoc )
    .then( doc => doc.toBiopaxTemplate() )
    .then( getSbgnFromTemplates )
    .then( result => result.text() )
    .then( xml => res.send( xml ))
    .catch( next );
});

/**
 * @swagger
 *
 * /api/document/text/{id}:
 *   get:
 *     description: Retrieve plain english description of a Document's interactions
 *     summary:  Retrieve plain english description of a Document's interactions
 *     tags:
 *       - Document
 *     parameters:
 *       - name: id
 *         description: Document ID
 *         summary: Document ID
 *         in: path
 *         required: true
 *     responses:
 *       '200':
 *         description: ok
 *         content:
 *           text/plain:
 *             description: Retrieve plain english description of a Document's interactions
 *       '500':
 *         $ref: '#/components/responses/Bad ID'
 */
http.get('/text/:id', function( req, res, next ){
  let id = req.params.id;
  tryPromise( loadTables )
    .then( json => _.assign( {}, json, { id } ) )
    .then( loadDoc )
    .then( doc => doc.toText() )
    .then( txt => res.send( txt ))
    .catch( next );
});

const getRelPprsForDoc = async doc => {
  let papers = [];
  const getUid = result => _.get( result, 'uid' );
  const { pmid } = doc.citation();
  if( pmid ){
    const pmids = await db2pubmed({ uids: [pmid] });
    let rankedDocs = await indra.semanticSearch({ query: pmid, documents: pmids });
    const uids = _.take( rankedDocs, SEMANTIC_SEARCH_LIMIT ).map( getUid );
    const { PubmedArticleSet } = await fetchPubmed({ uids });
    papers = PubmedArticleSet
      .map( getPubmedCitation )
      .map( citation => ({ pmid: citation.pmid, pubmed: citation }) );
  }

  doc.relatedPapers( papers );
};

const getRelatedPapers = async doc => {
  const els = doc.elements();

  const toTemplate = el => el.toSearchTemplate();

  const getRelPprsForEl = async el => {
    const template = toTemplate(el);

    const templates = {
      intns: el.isInteraction() ? [ template ] : [],
      entities: el.isEntity() ? [ template ] : []
    };

    const indraRes = await indra.searchDocuments({ templates, doc });

    el.relatedPapers( indraRes || [] );
  };

  await Promise.all([ ...els.map(getRelPprsForEl) ]);

  const docPprs = doc.relatedPapers();
  const getPmid = ppr => ppr.pubmed.pmid;

  await Promise.all( doc.elements().map(async el => {
    const pprs = el.relatedPapers();

    if( pprs.length > MIN_RELATED_PAPERS ){ return; }

    const newPprs = _.uniq( _.concat(pprs, _.shuffle(docPprs)), getPmid );

    await el.relatedPapers(newPprs);
  }) );
};

export default http;
export { getDocumentJson,
  loadTables, loadDoc, fillDocArticle
}; // allow access so page rendering can get the same data as the rest api
