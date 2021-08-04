import logger from '../../../logger';
import { DEMO_SECRET, DOCUMENT_CRON_CREATED_AGE_DAYS, DOCUMENT_CRON_REFRESH_ENABLED, DOCUMENT_CRON_UNEDITED_DAYS } from '../../../../config';
import { loadTables, loadDoc, fillDocArticle, updateRelatedPapers } from  './index';
import Document from '../../../../model/document';

const DOCUMENT_STATUS_FIELDS = Document.statusFields();
const DEFAULT_DOCUMENT_CREATED_START_DATE = new Date( 0 );

const HOURS_PER_DAY = 24;
const MINUTES_PER_HOUR = 60;
const SECONDS_PER_MINUTE = 60;
const MILLISECONDS_PER_SECOND = 1000;

const daysToMs = d => d * HOURS_PER_DAY * MINUTES_PER_HOUR * SECONDS_PER_MINUTE * MILLISECONDS_PER_SECOND;
const daysToSec = d => d * HOURS_PER_DAY * MINUTES_PER_HOUR * SECONDS_PER_MINUTE;
const dateFromToday = days => {
  const now = Date.now();
  const offset = daysToMs( days );
  return new Date( now + offset );
};

let mtime = null; // milliseconds
const lastUpdateTime = t => {
  if( !t ){
    return mtime;
  } else {
    mtime = t;
  }
};

const docsToUpdate = async () => {

  const tables = await loadTables();
  const { docDb, eleDb } = tables;
  let { table: q, conn, rethink: r } = docDb;

  // Filter: Exclude DEMO
  q = q.filter( r.row( 'secret' ).ne( DEMO_SECRET ) );

  // Filter: Exclude by status 'trashed'
  q = q.filter( r.row( 'status' ).ne( DOCUMENT_STATUS_FIELDS.TRASHED ) );

  // Filter: Include when created less than  days ago
  let startDate = DOCUMENT_CRON_CREATED_AGE_DAYS ? dateFromToday( -1 * DOCUMENT_CRON_CREATED_AGE_DAYS ) : DEFAULT_DOCUMENT_CREATED_START_DATE;
  q = q.filter( r.row( 'createdDate' ).during( startDate, new Date() ) );

  // Filter: Include when article is missing metadata (implied vis a vis missing pmid)
  if( !DOCUMENT_CRON_REFRESH_ENABLED ){
    q = q.filter(
      r.not(
        r.row( 'article' )( 'PubmedData' )( 'ArticleIdList' ).contains( ArticleId => ArticleId('IdType').eq('pmid') )
      )
    );
  }

  q = q.orderBy( r.desc( 'createdDate' ) );
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
  try {
    const docs = await docsToUpdate();
    for( const doc of docs ){
      await fillDocArticle( doc );
      await updateRelatedPapers( doc );
    }
    lastUpdateTime( Date.now() );

  } catch ( err ) {
    logger.error(`Error in Article update ${err}`);
  }
};

const docsToTrash = async () => {
  const tables = await loadTables();
  const { docDb, eleDb } = tables;
  let { table: q, conn, rethink: r } = docDb;

  // Normalize time object
  // https://github.com/PathwayCommons/factoid/issues/997#issuecomment-891985488
  const toTime = field => r.branch(
    r.typeOf( r.row( field ) ).eq( 'STRING' ), r.ISO8601( r.row( field ) ),
    r.row( field )
  );
  const editedMoreThanDaysAgo = d => r.now().sub( toTime( 'lastEditedDate' ) ).gt( daysToSec( d ) );

  // Predicates: demo docs
  const isDemo = r.row( 'secret' ).eq( DEMO_SECRET );
  const demoNotRecentlyEdited = editedMoreThanDaysAgo( DOCUMENT_CRON_UNEDITED_DAYS );
  const isOldDemo = isDemo.and( demoNotRecentlyEdited );

  // Predicates: Initiated docs
  const isInitiated = r.row( 'status' ).eq( DOCUMENT_STATUS_FIELDS.INITIATED );
  const initiatedNotRecentlyEdited = editedMoreThanDaysAgo( DOCUMENT_CRON_UNEDITED_DAYS );
  const noPubMedId = r.not( r.row( 'article' )( 'PubmedData' )( 'ArticleIdList' ).contains( ArticleId => ArticleId('IdType').eq('pmid') ) );
  const noEntries = r.row('entries').count().eq( 0 );
  const isOldEmptyInitated = isDemo.not()
    .and( isInitiated )
    .and( initiatedNotRecentlyEdited )
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
 * update
 *
 * Update Document data
 *
 * @param {Number} updatePeriodDays The time, in days, between successive updates
 */
const update = async updatePeriodDays => {
  try {
    let shouldUpdate = false;
    if( lastUpdateTime() == null ){
      shouldUpdate = true;
    } else {
      const timeSinceLastUpdate = Date.now() - lastUpdateTime();
      shouldUpdate = timeSinceLastUpdate > daysToMs( updatePeriodDays );
    }

    if ( shouldUpdate ){
      await updateArticle();
      await trashDocs();
    }
  } catch ( err ) {
    logger.error(`Error in Document update ${err}`);
  }
};

export default update;