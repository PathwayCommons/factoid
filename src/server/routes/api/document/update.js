import logger from '../../../logger';
import { DEMO_SECRET, DOCUMENT_CRON_CREATED_AGE_DAYS } from '../../../../config';
import { loadTables, loadDoc, fillDocArticle } from  './index';
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

  // Filter: Exclude DEMO
  q = q.filter( r.row( 'secret' ).ne( DEMO_SECRET ) );

  // Filter: Exclude by status 'trashed'
  q = q.filter( r.row( 'status' ).ne( DOCUMENT_STATUS_FIELDS.TRASHED ) );

  // Filter: Include when createdDate after startDate
  let startDate = DOCUMENT_CRON_CREATED_AGE_DAYS ? dateFromToday( -1 * DOCUMENT_CRON_CREATED_AGE_DAYS ) : DEFAULT_DOCUMENT_CREATED_START_DATE;
  q = q.filter( r.row( 'createdDate' ).during( startDate, new Date() ) );

  // Filter: Includee when article has missing attributes (doi, pmid)
  q = q.filter(
    r.not(
      r.row( 'article' )( 'PubmedData' )( 'ArticleIdList' ).contains( ArticleId => ArticleId('IdType').eq('doi') )
    )
  );

  q = q.filter(
    r.not(
      r.row( 'article' )( 'PubmedData' )( 'ArticleIdList' ).contains( ArticleId => ArticleId('IdType').eq('pmid') )
    )
  );

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
 * @param {Number} createdAgeDays Documents created within this number of days will be selected for update.
 *  If undefined, it will default to DEFAULT_DOCUMENT_CREATED_START_DATE
 */
const updateArticle = async () => {
  try {
    const docs = await docsToUpdate();
    for( const doc of docs ){
      const { paperId } = doc.provided();
      logger.info( `Updating article info for paperId: ${paperId}`);
      await fillDocArticle( doc, paperId );
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
    logger.info( `Document update call received`);
    const timeSinceLastUpdate = Date.now() - lastUpdateTime();
    const shouldUpdate = lastUpdateTime() == null || timeSinceLastUpdate > daysToMs( updatePeriodDays );
    if ( shouldUpdate ){
      await updateArticle();
    }
  } catch ( err ) {
    logger.error(`Error in Document update ${err}`);
  }
};

export default update;