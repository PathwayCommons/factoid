// TODO swagger comment & docs
import isWithinInterval from 'date-fns/isWithinInterval';
import Express from 'express';
import _ from 'lodash';
import uuid from 'uuid';
import fetch from 'node-fetch';
import cytosnap from 'cytosnap';
import Twitter from 'twitter';
import LRUCache from 'lru-cache';
import emailRegex from 'email-regex';
import url from 'url';
import fs from 'fs';
import { URLSearchParams } from  'url';
import * as xmljs from 'xml-js';

import { exportToZip, EXPORT_TYPES } from './export';
import { tryPromise, makeStaticStylesheet, makeCyEles, truncateString } from '../../../../util';
import { msgFactory, updateCorrespondence, EmailError } from '../../../email';
import sendMail from '../../../email-transport';
import Document from '../../../../model/document';
import Organism from '../../../../model/organism';
import db from '../../../db';
import logger from '../../../logger';
import { getPubmedArticle } from './pubmed';
import { AdminPapersQueue, PCPapersQueue } from './related-papers-queue';
import { createPubmedArticle, getPubmedCitation } from '../../../../util/pubmed';
import * as indra from './indra';
import { get as groundingSearchGet } from '../element-association/grounding-search';
import { BASE_URL,
  BIOPAX_CONVERTER_URL,
  GROUNDING_SEARCH_BASE_URL,
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
  EMAIL_ADMIN_ADDR,
  EMAIL_RELPPRS_CONTACT,
  // EMAIL_TYPE_INVITE,
  DOCUMENT_IMAGE_CACHE_SIZE,
  EMAIL_TYPE_FOLLOWUP,
  MIN_RELATED_PAPERS,
  SEMANTIC_SEARCH_LIMIT,
  NCBI_EUTILS_BASE_URL,
  PC_URL,
  EMAIL_TYPE_REL_PPR_NOTIFICATION,
  EMAIL_ADDRESS_ADMIN
 } from '../../../../config';

import { ENTITY_TYPE } from '../../../../model/element/entity-type';
import { eLink, elink2UidList } from './pubmed/linkPubmed';
import { fetchPubmed } from './pubmed/fetchPubmed';
import { docs2Sitemap } from '../../../sitemap';
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

const mapToUniprotIds = docTemplate => {
  const updateGrounding = entityTemplate => {
    if ( entityTemplate == null ) {
      return Promise.resolve();
    }

    let xref = entityTemplate.xref;
    let { id, dbPrefix } = xref;

    if ( dbPrefix !== 'ncbigene' ){
      return Promise.resolve();
    }

    const opts = {
      id: [
        id
      ],
      dbfrom: dbPrefix,
      dbto: 'uniprot'
    };

    return fetch( GROUNDING_SEARCH_BASE_URL + '/map', {
      method: 'POST',
      body: JSON.stringify( opts ),
      headers: {
        'Content-Type': 'application/json'
      }
    } )
    .then( res => res.json() )
    .then( res => {
      let dbXref = _.get( res, [ 0, 'dbXrefs', 0 ] );
      if ( dbXref ) {
        xref.id = dbXref.id;
        xref.db = dbXref.db;
      }
    } );
  };
  let intnTemplates = docTemplate.interactions;
  let promises = intnTemplates.map( intnTemplate => {
    let ppts = intnTemplate.participants;
    return updateGrounding( intnTemplate.controller )
      .then( () => updateGrounding( intnTemplate.source ) )
      .then( () => updateGrounding( _.get( ppts, 0 ) ) )
      .then( () => updateGrounding( _.get( ppts, 1 ) ) );
  } );

  let chunks = _.chunk( promises, 10 );

  const handleChunk = i => {
    if ( i == chunks.length ) {
      return Promise.resolve();
    }

    return Promise.all( chunks[i] ).then( () => handleChunk( i + 1 ) );
  };

  return handleChunk( 0 )
    .then( () => docTemplate );
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

    // Only supply default when no previous retrieval (pmid is null)
    const { pmid } = doc.citation();
    if( pmid == null ){
      const pubmedRecord = createPubmedArticle({ articleTitle: paperId });
      await doc.article( pubmedRecord );
      await doc.issues({ paperId: { error, message: error.message } });
    }
  }
};

const findOrcidUri = async ( firstName, lastName, doi ) => {
  let url = `https://pub.orcid.org/v3.0/search?q=`
      + `family-name:${lastName}+AND+given-names:${firstName}+AND+digital-object-ids:%22${doi}%22`;

  const findUri = obj => {
    let els = _.get( obj, [ 'elements', 0, 'elements', 0, 'elements', 0, 'elements' ] );
    let uriObj = _.find( els, el => el.name = 'common:uri' );
    let uri = _.get( uriObj, [ 'elements', 0, 'text' ] );

    return uri;
  };

  return fetch( url )
    .then( res => res.text() )
    .then( res => xmljs.xml2json(res) )
    .then( res => JSON.parse( res ) )
    .then( findUri )
    .catch( error => {
      logger.error( `Error finding Orcid URI: ${error.message}`);
      return null;
    } );
};

const fillDocAuthorProfiles = async doc => {
  const citation = doc.citation();
  const { authors, doi } = citation;

  let promises = authors.authorList.map( async a => {
    let orcid = await findOrcidUri( a.ForeName, a.LastName, doi );
    orcid = orcid || null;

    let authorProfile =  _.assignIn({}, a, { orcid });
    return authorProfile;
  });

  let authorProfiles = await Promise.all( promises );
  await doc.authorProfiles( authorProfiles );
};

const fillDoc = async doc => {
  await fillDocCorrespondence( doc );
  await fillDocArticle( doc );
  await fillDocAuthorProfiles( doc );
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
// const hasIssue = ( doc, key ) => _.has( doc.issues(), key ) && !_.isNull( _.get( doc.issues(), key ) );
// TODO: was not used?
// const sendInviteNotification = async doc => {
//   let emailType = EMAIL_TYPE_INVITE;
//   const id = doc.id();
//   const secret = doc.secret();
//   const hasAuthorEmailIssue = hasIssue( doc, 'authorEmail' );
//   if( !hasAuthorEmailIssue ) await configureAndSendMail( emailType, id, secret );
//   return doc;
// };

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

let getNcbiIdfromRefSeqId = id => {
  const params = new URLSearchParams();
  params.append('id', id);
  params.append('cmd', 'neighbor');
  params.append('retmode', 'json');
  params.append('db', 'gene');
  params.append('dbfrom', 'nuccore');
  params.append('linkname', 'nuccore_gene');

  return fetch( NCBI_EUTILS_BASE_URL + 'elink.fcgi', {
    'method': 'POST',
    'headers': {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    'body': params
  } )
  .then(handleResponseError)
  .then( res => res.json() )
  .then( js => _.get( js, ['ids', 0] ) );
};

let getNcbiIdfromHgncSymbol = symbol => {
  return fetch( PC_URL + 'api/enrichment/validation', {
    'method': 'POST',
    'headers': {
      'Content-Type': 'application/json'
    },
    'body': JSON.stringify({
      'query': [ symbol ],
      'namespace': 'ncbigene'
    })
  } )
  .then(handleResponseError)
  .then( res => res.json() )
  .then( js => {
    let obj = _.get( js, 'alias' );

    if ( obj ) {
      return obj[symbol];
    }

    return null;
  } );
};

let getNcbiIdFromUniprotId = id => {
  let namespace = 'uniprot';
  return groundingSearchGet( { id, namespace } )
    .then( res => {
      let dbXref = _.find( res.dbXrefs, xref => xref.db == 'GeneID' );
      return _.get( dbXref, 'id', null );
    } );
};

let searchByXref = ( xref ) => {
  let { db, id } = xref;
  let getNcbiId;
  if ( db == 'uniprot' ) {
    getNcbiId = getNcbiIdFromUniprotId;
  }
  else if ( db == 'refseq' ) {
    getNcbiId = getNcbiIdfromRefSeqId;
  }
  else if ( db == 'hgnc symbol' ) {
    getNcbiId = getNcbiIdfromHgncSymbol;
  }

  if ( getNcbiId != null ) {
    try {
      return getNcbiId( id ).then( ncbiId => {
        if ( ncbiId == null ) {
          return Promise.resolve( null );
        }

        return groundingSearchGet( { id: ncbiId, namespace: 'ncbi' } );
      } );
    }
    catch( err ) {
      logger.error(`Error searchByXref: ${err}`);
    }
  }

  return null;
};

let getJsonFromBiopaxUrl = url => {
  return fetch( BIOPAX_CONVERTER_URL + 'biopax-url-to-json', {
    method: 'POST',
    body: url,
    headers: {
      'Content-Type': 'text/plain',
      'Accept':'application/json' }
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
 * generateSitemap
 * Create sitemap xml data for documents with PUBLIC status
 *
 * @return an sitemap conforming to [sitemaps.org]{@link https://www.sitemaps.org/protocol.html}
 */
const generateSitemap = () => {
  let status = DOCUMENT_STATUS_FIELDS.PUBLIC;
  let tables;

  return (
    tryPromise( () => loadTables() )
    .then( tbls => {
      tables = tbls;
      return tables;
    })
    .then( tables => {
      let t = tables.docDb;
      let { table, conn, rethink: r } = t;
      let q = table;

      q = q.filter( r.row( 'status' ).eq( status ) );
      q = q.orderBy( r.desc( 'createdDate' ) );
      q = q.pluck( ['id', 'secret'] );
      return q.run( conn );
    })
    .then( cursor => cursor.toArray() )
    .then( res => {
      return Promise.all( res.map( docDbJson => {
        let { id } = docDbJson;
        let docOpts = _.assign( {}, tables, { id } );
        return loadDoc( docOpts ).then( getDocJson );
      }));
    } )
    .then( docs2Sitemap )
  );
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
 *     parameters:
 *       - name: idMapping
 *         in: query
 *         description: Whether to mao ncbi ids to uniprot ids in biopax conversion
 *     responses:
 *      '200':
 *        description: OK
 *        content:
 *          application/zip:
 *             description: Download a zip file containing each Document represented as BioPAX in owl file format.
 */
http.get('/zip/biopax', function( req, res, next ){
  const queryObject = url.parse( req.url, true ).query;
  let filePath = 'download/factoid_biopax.zip';
  let idMapping = _.get( queryObject, 'idMapping' ) == 'true';

  if ( idMapping ) {
    filePath = 'download/factoid_biopax_with_id_mapping.zip';
  }

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
      return exportToZip(addr, filePath, [ EXPORT_TYPES.BP ], idMapping);
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
 *       - initiated
 *       - submitted
 *       - public
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

  let tables, total;

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
      let count;

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

      count = q.count();

      if( !ids ){
        q = q.skip(offset).limit(limit);
      }

      q = q.pluck(['id', 'secret']);

      return Promise.all([
        count.run( conn ),
        q.run( conn )
      ]);
    })
    .then( ([ count, cursor ]) => {
      total = count;
      return cursor.toArray();
    })
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
    .then( results => {
      res.set({ 'X-Document-Count': total });
      res.json( results );
    })
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

const getDoc = id => {
  return ( tryPromise( loadTables )
    .then( json => _.assign( {}, json, { id } ) )
    .then( loadDoc )
  );
};

const getDocumentImageBuffer = doc => {
  const cyStylesheet = makeStaticStylesheet();
  const imageWidth = DOCUMENT_IMAGE_WIDTH;
  const imageHeight = DOCUMENT_IMAGE_HEIGHT;
  const imagePadding = DOCUMENT_IMAGE_PADDING;

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

  return ( tryPromise(() => doc)
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

  const fillCache = async (doc, lastEditedDate) => {
    const img = await getDocumentImageBuffer(doc);
    const cache = { img, lastEditedDate };

    imageCache.set(id, cache);

    return cache;
  };

  const main = async () => {
    try {
      const doc = await getDoc(id);
      const lastEditedDate = '' + doc.lastEditedDate();
      const cache = imageCache.get(id);
      const canUseCache = imageCache.has(id) && cache.lastEditedDate === lastEditedDate;

      if( canUseCache ){
        res.send(cache.img);
      } else {
        const cache = await fillCache(doc, lastEditedDate);

        res.send(cache.img);
      }
    } catch(err){
      next(err);
    }
  };

  main();
});

// tweet a document as a card with a caption (text)
const tweetDoc = ( doc, text ) => {
  const id = doc.id();
  const url = `${BASE_URL}/document/${id}`;
  const status = `${text} ${url}`;

  return  tryPromise( () => twitterClient.post( 'statuses/update', { status } ) )
      .then( tweet =>  doc.setTweetMetadata( tweet ) );
};

const tryTweetingDoc = async ( doc, text ) => {

  const shouldTweet = doc => {
    const alreadyTweeted = doc.hasTweet();
    const readOnly = _.isNil( doc.secret() );
    const isShareableDemo = doc.id() === DEMO_ID && DEMO_CAN_BE_SHARED;
    return ( !alreadyTweeted && !readOnly ) || isShareableDemo;
  };

  if ( shouldTweet( doc ) ) {
    try {
      if( !text ) text = truncateString( doc.toText(), MAX_TWEET_LENGTH );
      await tweetDoc( doc, text );
    } catch ( e ) {
      logger.error( `Error attempting to Tweet: ${JSON.stringify(e)}` ); //swallow
    }
  } else {
    logger.info( `This doc cannot be Tweeted at this time` );
  }

  return doc;
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

  return (
    tryPromise( () => loadTables() )
    .then( ({ docDb, eleDb }) => loadDoc ({ docDb, eleDb, id, secret }) )
    .then( doc => tryTweetingDoc( doc, text) )
    .then( getDocJson )
    .then( json => res.json( json ) )
    .catch( next )
  );
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

const getNovelInteractions = async doc => {
  // n.b. will be empty if we haven't yet queried for related papers
  return doc.interactions().filter(intn => intn.isNovel());
};

const emailRelatedPaperAuthors = async doc => {
  if( doc.relatedPapersNotified() ){ return; } // bail out if already notified
  const MAX_AGE_PAPER_YEARS = 5;

  const getContact = paper => _.get(paper, ['pubmed', 'authors', 'contacts', 0]);

  const hasContact = paper => getContact(paper) != null;

  const createEmptyDoc = async (authorName, authorEmail) => {
    const provided = {
      authorEmail,
      authorName
    };

    const doc = await postDoc(provided);

    return doc;
  };

  const sendEmail = async (paper, novelIntns) => {
    const contact = getContact(paper);
    const email = EMAIL_RELPPRS_CONTACT ? contact.email[0] : EMAIL_ADMIN_ADDR;
    const name = contact.ForeName;
    const fullName = contact.name;

    // prevent duplicate sending
    doc.relatedPapersNotified(true);

    const newDoc = await createEmptyDoc(fullName, email);
    const editorUrl = `${BASE_URL}${newDoc.privateUrl()}`;

    const mailOpts =  await msgFactory(EMAIL_TYPE_REL_PPR_NOTIFICATION, doc, {
      to: EMAIL_RELPPRS_CONTACT ? email : EMAIL_ADMIN_ADDR, //must explicitly turn off
      name,
      paper,
      novelIntns,
      editorUrl
    });

    // Sending blocked by default, otherwise set EMAIL_ENABLED=true
    await sendMail(mailOpts);

    logger.info(`Related paper notification email for doc ${doc.id()} sent to ${name} at ${email} with ${novelIntns.length} novel interactions`);
  };

  // TODO RPN use semantic search score etc. in future
  // just send to all for now, as we already have a small cutoff at 30
  const notReviewPaper = async paper => {
    const reviewTypeUI = 'D016454';
    const pubTypes = _.get( paper, ['pubmed', 'pubTypes'] );
    const notReview = !_.find( pubTypes, ['UI', reviewTypeUI] );
    return notReview;
  };

  const publishedNYearsAgo = ( paper, years = MAX_AGE_PAPER_YEARS ) => {
    const dateNow = new Date();
    const dateYearsAgo = ( new Date() ).setFullYear( dateNow.getFullYear() - years );
    const paperDate = new Date( _.get( paper, ['pubmed', 'ISODate'] ) );
    return isWithinInterval( paperDate, { start: dateYearsAgo, end: dateNow } );
  };

  const paperIsGoodFit = async paper => publishedNYearsAgo( paper ) && notReviewPaper( paper );

  const byPaperDate = (a, b) => {
    const getISODate = p => _.get( p, ['pubmed', 'ISODate'] );
    return new Date( getISODate( a ) ) - new Date( getISODate( b ) );
  };

  const getSendablePapers = async papers => {
    const isGoodFit = await Promise.all(papers.map(paperIsGoodFit));
    return papers.filter((paper, i) => isGoodFit[i] && hasContact(paper)).sort( byPaperDate );
  };

  const novelIntns = await getNovelInteractions(doc);

  const papers = await getSendablePapers(doc.referencedPapers());

  logger.info(`Sending related paper notifications for doc ${doc.id()} with ${papers.length} papers`);

  await Promise.all(papers.map(async paper => sendEmail(paper, novelIntns)));

  logger.info(`Related paper notifications complete for ${papers.length} emails`);
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
  const impl = async () => {
    try {
      const provided = _.assign( {}, req.body );
      const doc = await postDoc(provided);

      res.json(doc.json());
    } catch (err) {
      next(err);
    }
  };

  impl();
});

const postDoc = provided => {
  const { paperId, elements=[], performLayout, groundEls, authorName } = provided;
  const id = paperId === DEMO_ID ? DEMO_ID: undefined;
  const secret = paperId === DEMO_ID ? DEMO_SECRET: uuid();
  const fromAdmin = _.get( provided, 'fromAdmin', true );

  const elToXref = {};
  const elsToOmit = {};
  const isValidXref = xref => {
    if ( xref == null || xref.org == null ) {
      return false;
    }

    return Organism.fromId( Number( xref.org ) ) != Organism.OTHER;
  };
  // pass for the entities
  elements.forEach( el => {
    let xref = el._xref;
    if ( isValidXref( xref ) ) {
      elToXref[ el.id ] = xref;
    }
  } );
  // pass for the interactions
  elements.forEach( el => {
    let ppts = el.entries;
    if ( !_.isNil( ppts ) ){
      let pptIds = ppts.map( ppt => ppt.id );
      let hasInvalidPPt = _.some( pptIds, pptId => !elToXref[ pptId ] );
      if ( hasInvalidPPt ) {
        [ el.id, ...pptIds ].forEach( elId => elsToOmit[ elId ] = true );
      }
    }
  } );

  _.remove( elements, el => elsToOmit[ el.id ] );

  const setStatus = doc => tryPromise( () => doc.initiate() ).then( () => doc );
  const handleDocCreation = async ({ docDb, eleDb }) => {
    if( id === DEMO_ID ) await deleteTableRows( API_KEY, secret );
    return await createDoc({ docDb, eleDb, id, secret, provided });
  };
  const addEls = doc => tryPromise( () => doc.fromJson( { elements } ) ).then( () => doc );
  const handleLayout = doc => {
    if ( performLayout ) {
      return tryPromise( () => doc.applyLayout() ).then( () => doc );
    }

    return doc;
  };
  const handleElGroundings = doc => {
    const perform = () => {
      let entities = doc.entities();
      let entityIdsToRemove = new Set();

      let entityPromises = entities.map( entity => {
        let xref = elToXref[entity.id()];
        if ( !xref ) {
          return Promise.resolve();
        }

        return searchByXref( xref ).then( res => {
          if( res ) {
            return entity.associate( res ).then( () => entity.complete() );
          }

          entityIdsToRemove.add( entity.id() );
          return Promise.resolve();
        } );
      } );

      const handleIdsToRemove = () => {
        let intnIdsToRemove = new Set();

        entityIdsToRemove.forEach( entityId => {
          elements.forEach( el => {
            let ppts = el.entries;
            if ( !_.isNil( ppts ) ){
              let pptIds = ppts.map( ppt => ppt.id );
              let includesEntity = _.includes( pptIds, entityId );
              if ( includesEntity ) {
                pptIds.forEach( pptId => entityIdsToRemove.add( pptId ) );
                intnIdsToRemove.add( el.id );
              }
            }
          } );
        } );

        const entityRemovePromises = [ ...entityIdsToRemove ].map( entityId => doc.remove( entityId ) );
        const intnRemovePromises = [ ...intnIdsToRemove ].map( intnId => doc.remove( intnId ) );

        return Promise.all( entityRemovePromises )
          .then( () => Promise.all( intnRemovePromises ) );
      };



      return Promise.all( entityPromises )
        .then( handleIdsToRemove )
        .then( () => {
          let intns = doc.interactions();
          let intnPromises = intns.map( intn => intn.complete() );
          return Promise.all( intnPromises );
        } );
    };

    if ( groundEls ){
      return tryPromise( () => perform() ).then( () => doc );
    }

    return doc;
  };
  const handleDocSource = doc => {
    let fcn = () => doc.setAsPcDoc();
    if ( fromAdmin ){
      fcn = () => doc.setAsAdminDoc();
    }

    return fcn().then( () => doc );
  };
  const handleAuthorName = doc => {
    if ( !authorName ){
      return doc;
    }

    return doc.provided( { name: authorName } ).then( () => doc );
  };

  return tryPromise( () => createSecret({ secret }) )
    .then( loadTables )
    .then( handleDocCreation )
    .then( setStatus )
    .then( fillDoc )
    .then( tryVerify )
    .then( addEls )
    .then( handleElGroundings )
    .then( handleLayout )
    .then( handleDocSource )
    .then( handleAuthorName )
    .catch( _.nop );
};

/**
 * @swagger
 *
 * /api/document/from-url:
 *   post:
 *     description: Create new documents from given Biopax url
 *     summary: Create new documents from given Biopax url
 *     tags:
 *       - Document
 *     requestBody:
 *       description: Data to create new Documents
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               url:
 *                 type: string
 *     responses:
 *     '200':
 *       description: Success
 *     '500':
 *       description: Error
 */
http.post('/from-url', function( req, res, next ){

  const provided = _.assign( {}, req.body );

  const { url } = provided;

  tryPromise( () => getJsonFromBiopaxUrl( url ) )
    .then( response => response.json() )
    .then( docsJSON => new Promise( () => {
      let pmids = Object.keys( docsJSON );
      pmids = pmids.filter( pmid => pmid != null );
      // TODO: which email address?
      let authorEmail = EMAIL_ADDRESS_ADMIN;

      const updateAndSubmit = doc => updateRelatedPapers( doc ).then( () => doc.submit() );
      const addToRelatedPapersQueue = doc => PCPapersQueue.addJob( () => updateAndSubmit( doc ) );

      const handleNewDoc = pmid => {
        let docJSON = docsJSON[ pmid ];
        const data = _.assign( {}, {
          paperId: _.trim( pmid ),
          authorEmail,
          elements: docJSON,
          performLayout: true,
          groundEls: true,
          fromAdmin: false
        });

        return postDoc( data ).then( doc => {
          if ( doc.interactions().length == 0 ) {
            return doc.trash();
          }

          return addToRelatedPapersQueue( doc );
        } );
      };

      const processPmid = i => {
        if ( i == pmids.length ) {
          return Promise.resolve();
        }

        return handleNewDoc( pmids[ i ] ).then( () => processPmid( i + 1 ) );
      };

      processPmid( 0 )
        .then( () => res.end() )
        .catch( next );
    } ) );
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

  // Public criteria: non-empty; all entities complete
  const tryMakePublic = async doc => {
    const hasEles = doc => doc.elements().length > 0;
    const hasIncompleteEles = doc => doc.elements().some( ele => !ele.completed() && !ele.isInteraction() && ele.type() !== ENTITY_TYPE.COMPLEX );
    const shouldMakePublic = doc => hasEles( doc ) && !hasIncompleteEles( doc );
    if( shouldMakePublic( doc ) ) await doc.makePublic();
    return;
  };

  const sendFollowUpNotification = async doc => {
    await configureAndSendMail( EMAIL_TYPE_FOLLOWUP, doc.id(), doc.secret() );
    await emailRelatedPaperAuthors( doc );
  };

  const onDocPublic = async doc => {
    await AdminPapersQueue.addJob( async () => {
      await updateRelatedPapers( doc );
      await sendFollowUpNotification( doc );
    } );
  };

  const handleMakePublicRequest = async doc => {
    await tryMakePublic( doc );
    if( doc.isPublic() ) {
      await tryTweetingDoc( doc );
      onDocPublic( doc );
    }
  };

  const updateDoc = async doc => {
    const updates = req.body;
    for( const update of updates ){
      const { op, path, value } = update;

      switch ( path ) {
        case 'status':
          if( op === 'replace' && value === DOCUMENT_STATUS_FIELDS.PUBLIC ) await handleMakePublicRequest( doc );
          break;
        case 'article':
          if( op === 'replace' ) {
            await fillDocArticle( doc );
            await fillDocAuthorProfiles( doc );
          }
          break;
        case 'correspondence':
          if( op === 'replace' ){
            await fillDocCorrespondence( doc );
            await tryVerify( doc );
          }
          break;
        case 'relatedPapers':
          if( op === 'replace' ){
            await updateRelatedPapers( doc );
            await emailRelatedPaperAuthors( doc );
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
 *       - name: idMapping
 *         in: query
 *         description: Whether to mao ncbi ids to uniprot ids in biopax conversion
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
  const queryObject = url.parse( req.url, true ).query;
  let idMapping = _.get( queryObject, 'idMapping' ) == 'true';
  let omitDbXref = true;
  tryPromise( loadTables )
    .then( json => _.assign( {}, json, { id } ) )
    .then( loadDoc )
    .then( doc => doc.toBiopaxTemplate( omitDbXref ) )
    .then( template => {
      if ( !idMapping ) {
        return template;
      }

      return mapToUniprotIds( template );
    } )
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

const updateRelatedPapers = async doc => {
  await getRelPprsForDoc( doc );
  await getRelatedPapersForNetwork( doc );
  return doc;
};

const getRelPprsForDoc = async doc => {
  let relatedPapers = [];
  let referencedPapers = [];

  try {
    logger.info(`Updating document-level related papers for doc ${doc.id()}`);
    const getUid = result => _.get( result, 'uid' );
    const { pmid } = doc.citation();

    if( pmid == null ) throw new Error('Article pmid not available');

    const elinkResponse = await eLink( { id: [pmid] } );

    // For .relatedPapers
    const documents = elink2UidList( elinkResponse );
    let rankedDocs = await indra.semanticSearch({ query: pmid, documents });
    const uids = _.take( rankedDocs, SEMANTIC_SEARCH_LIMIT ).map( getUid );
    const relatedPapersResponse = await fetchPubmed({ uids });
    relatedPapers = _.get( relatedPapersResponse, 'PubmedArticleSet', [] )
      .map( getPubmedCitation )
      .map( citation => ({ pmid: citation.pmid, pubmed: citation }) );
    doc.relatedPapers( relatedPapers );

    // For .referencedPapers
    const referencedPaperUids = elink2UidList( elinkResponse, ['pubmed_pubmed_refs'], 100 );
    if( referencedPaperUids.length ){
      const referencedPapersResponse = await fetchPubmed({ uids: referencedPaperUids });
      referencedPapers = _.get( referencedPapersResponse, 'PubmedArticleSet', [] )
        .map( getPubmedCitation )
        .map( citation => ({ pmid: citation.pmid, pubmed: citation }) );
    }

    doc.referencedPapers( referencedPapers );
    logger.info(`Finished updating document-level related papers`);
    return doc;

  } catch ( err ){
    logger.error(`Error getRelPprsForDoc: ${err}`);

    // Only supply default when no previous retrieval
    if( _.isNil( doc.relatedPapers() ) ) doc.relatedPapers( relatedPapers );
    if( _.isNil( doc.referencedPapers() ) ) doc.referencedPapers( referencedPapers );

    return doc;
  }

};

const getRelatedPapersForNetwork = async doc => {

  try {
    logger.info(`Updating network-level related papers for doc ${doc.id()}`);
    const els = doc.elements();

    const toTemplate = el => el.toSearchTemplate();

    const getRelPprsForEl = async el => {
      const template = toTemplate(el);

      const templates = {
        intns: el.isInteraction() ? [ template ] : [],
        entities: el.isEntity() ? [ template ] : []
      };

      let indraRes = await indra.searchDocuments({ templates, doc });
      indraRes = indraRes || [];

      if ( el.isInteraction() ) {
        if ( indraRes.length == 0 ) {
          el.setNovel( true );
        }
      }

      el.relatedPapers( indraRes );
    };

    let elChunks = _.chunk( els, 1 );
    for ( let i = 0; i < elChunks.length; i++ ) {
      let chunk = elChunks[ i ];
      await Promise.all([ ...chunk.map(getRelPprsForEl) ]);
    }

    const docPprs = doc.relatedPapers();
    const getPmid = ppr => ppr.pubmed.pmid;

    await Promise.all( doc.elements().map(async el => {
      const pprs = el.relatedPapers();

      if( pprs.length > MIN_RELATED_PAPERS ){ return; }

      const newPprs = _.uniq( _.concat(pprs, _.shuffle(docPprs)), getPmid );

      await el.relatedPapers(newPprs);
    }) );
    logger.info(`Finished updating network-level related papers for doc`);
    return doc;

  } catch ( err ) {
    logger.error(`Error in getRelatedPapersForNetwork ${err.message}`);
    return doc;
  }

};

export default http;
export { getDocumentJson,
  loadTables, loadDoc, fillDocArticle, updateRelatedPapers,
  generateSitemap
}; // allow access so page rendering can get the same data as the rest api
