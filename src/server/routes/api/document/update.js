import logger from '../../../logger';
import { DEMO_SECRET, DOCUMENT_CRON_CREATED_AGE_DAYS, DOCUMENT_CRON_REFRESH_ENABLED } from '../../../../config';
import { loadTables, loadDoc, fillDocArticle, updateRelatedPapers } from  './index';
import Document from '../../../../model/document';

const DOCUMENT_STATUS_FIELDS = Document.statusFields();
const DEFAULT_DOCUMENT_CREATED_START_DATE = new Date( 0 );

const HOURS_PER_DAY = 24;
const MINUTES_PER_HOUR = 60;
const SECONS_PER_MINUTE = 60;
const MILLISECONDS_PER_SECOND = 1000;

const daysToMs = d => d * HOURS_PER_DAY * MINUTES_PER_HOUR * SECONS_PER_MINUTE * MILLISECONDS_PER_SECOND;
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
  const toTime = field => r.branch(
    r.typeOf( r.row( field ) ).eq( 'STRING' ), r.ISO8601( r.row( field ) ),
    r.typeOf( r.row( field ) ).eq( 'NUMBER' ), r.epochTime( r.row( field ) ),
    r.row( field ) // 'PTYPE<TIME>'
  );

  // Filter: Exclude DEMO
  q = q.filter( r.row( 'secret' ).ne( DEMO_SECRET ) );

  // Filter: Exclude by status 'trashed'
  q = q.filter( r.row( 'status' ).ne( DOCUMENT_STATUS_FIELDS.TRASHED ) );

  // Filter: Include when created less than DOCUMENT_CRON_CREATED_AGE_DAYS days ago
  let startDate = DOCUMENT_CRON_CREATED_AGE_DAYS ? dateFromToday( -1 * DOCUMENT_CRON_CREATED_AGE_DAYS ) : DEFAULT_DOCUMENT_CREATED_START_DATE;
  q = q.filter( toTime( 'createdDate' ).during( startDate, new Date() ) );

  // Filter: Include when article is missing metadata (implied vis a vis missing pmid)
  if( !DOCUMENT_CRON_REFRESH_ENABLED ){
    q = q.filter(
      r.not(
        r.row( 'article' )( 'PubmedData' )( 'ArticleIdList' ).contains( ArticleId => ArticleId('IdType').eq('pmid') )
      )
    );
  }

  q = q.orderBy( r.desc( toTime('createdDate') ) );
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
    }
  } catch ( err ) {
    logger.error(`Error in Document update ${err}`);
  }
};

export default update;