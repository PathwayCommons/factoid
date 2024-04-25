import logger from '../../../logger';
import {
  DEMO_SECRET,
  DOCUMENT_CRON_STALE_PERIOD,
  DOCUMENT_CRON_UPDATE_PERIOD
} from '../../../../config';
import { loadTables, loadDoc, fillDocArticle, fillDocAuthorProfiles } from  './index';
import Document from '../../../../model/document';
import { Timer, toSeconds } from '../../../../util/time.js';

const DOCUMENT_STATUS_FIELDS = Document.statusFields();

const timer = new Timer( DOCUMENT_CRON_UPDATE_PERIOD );

const docsToUpdate = async () => {

  const tables = await loadTables();
  const { docDb, eleDb } = tables;
  let { table: q, conn, rethink: r } = docDb;

  q = q.orderBy({ index: r.desc( 'createdDate' ) });

  // Filter: Exclude DEMO
  q = q.filter( r.row( 'secret' ).ne( DEMO_SECRET ) );

  // Filter: Exclude by status 'trashed'
  q = q.filter( r.row( 'status' ).ne( DOCUMENT_STATUS_FIELDS.TRASHED ) );

  // Filter: Only those with a paper id provided
  q = q.filter( r.row( 'provided' ).hasFields( 'paperId' ) );

  q = q.pluck([ 'id', 'secret' ]);

  const cursor =  await q.run( conn );
  const dbJSON = await cursor.toArray();
  return Promise.all( dbJSON.map( ({ id, secret }) => loadDoc({ docDb, eleDb, id, secret }) ));
};

/**
 * updateArticle
 *
 * Update the Document article data
 *
 */
const updateArticle = async () => {
  const chunkify = ( arr, chunkSize = 3 ) => {
    const res = [];
    for (let i = 0; i < arr.length; i += chunkSize) {
        const chunk = arr.slice(i, i + chunkSize);
        res.push(chunk);
    }
    return res;
  };

  try {
    const docs = await docsToUpdate();
    logger.info( `Updating data for ${docs.length} documents`);
    let chunks = chunkify( docs );
    for( const chunk of chunks ){
      await Promise.all( chunk.map( fillDocArticle ) );
      await Promise.all( chunk.map( fillDocAuthorProfiles ) );
    }

  } catch ( err ) {
    logger.error(`Error in Article update ${err}`);
  }
};

const docsToTrash = async () => {
  const tables = await loadTables();
  const { docDb, eleDb } = tables;
  let { table: q, conn, rethink: r } = docDb;

  const toTime = field => r.branch(
    r.typeOf( r.row( field ) ).eq( 'STRING' ), r.ISO8601( r.row( field ) ),
    r.typeOf( r.row( field ) ).eq( 'NUMBER' ), r.epochTime( r.row( field ) ),
    r.row( field )
  );

  const isStale = r.now().sub( toTime( 'lastEditedDate' ) ).gt( toSeconds( DOCUMENT_CRON_STALE_PERIOD ) );

  // Predicates: demo docs
  const isDemo = r.row( 'secret' ).eq( DEMO_SECRET );
  const isOldDemo = isDemo.and( isStale );

  // Predicates: Initiated docs
  const isInitiated = r.row( 'status' ).eq( DOCUMENT_STATUS_FIELDS.INITIATED );
  const noPubMedId = r.not( r.row( 'article' )( 'PubmedData' )( 'ArticleIdList' ).contains( ArticleId => ArticleId('IdType').eq('pmid') ) );
  const noEntries = r.row('entries').count().eq( 0 );
  const isOldEmptyInitated = isDemo.not()
    .and( isInitiated )
    .and( isStale )
    .and( noPubMedId )
    .and( noEntries );

  q = q.filter( isOldDemo.or( isOldEmptyInitated ) );
  q = q.pluck([ 'id', 'secret' ]);

  const cursor =  await q.run( conn );
  const dbJSON = await cursor.toArray();
  return Promise.all( dbJSON.map( ({ id, secret }) => loadDoc({ docDb, eleDb, id, secret }) ));
};


/**
 * trashDocs
 *
 * Send the selected Documents to trash
 */
const trashDocs = async () => {
  const toTrash = doc => doc.trash();
  const docs = await docsToTrash();
  logger.info( `CRON: Moving ${docs.length} documents to trash`);
  return Promise.all( docs.map( toTrash ) );
};

/**
 * Update Document data
 */
const update = async () => {
  logger.debug('update check');
  logger.debug(`timer.delay: ${timer.delay}`);
  logger.debug(`timer.last: ${timer.last}`);
  if ( !timer.hasElapsed() ) return;

  try {
    logger.debug('firing an update');
    await updateArticle();
    await trashDocs();
  } catch ( err ) {
    logger.error(`Error in Document update ${err}`);
  } finally {
    timer.reset();
    logger.debug(`resetting timer.last: ${timer.last}`);
  }
};

export default update;