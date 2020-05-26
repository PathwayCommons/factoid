import logger from '../../../logger';
import { DEMO_SECRET, DOCUMENT_CRON_UPDATE_PERIOD_DAYS, DOCUMENT_CRON_CREATED_AGE_DAYS } from '../../../../config';
import { loadTables, loadDoc, fillDocArticle } from  './index';

const HOURS_PER_DAY = 24;
const MINUTES_PER_HOUR = 60;
const SECONS_PER_MINUTE = 60;
const MILLISECONDS_PER_SECOND = 1000;

const daysToMs = d => d * HOURS_PER_DAY * MINUTES_PER_HOUR * SECONS_PER_MINUTE * MILLISECONDS_PER_SECOND;
const dateInPast = days => {
  const now = Date.now();
  const offset = daysToMs( days );
  return new Date( now - offset );
};

let mtime = null; // milliseconds
const lastUpdateTime = t => {
  if( !t ){
    return mtime;
  } else {
    mtime = t;
  }
};

const docsToUpdate = async startDate => {

  const tables = await loadTables();
  const { docDb, eleDb } = tables;
  let { table: q, conn, rethink: r } = docDb;

  // Filter: Exclude DEMO
  q = q.filter( r.row( 'secret' ).ne( DEMO_SECRET ) );

  // Filter: Include doc.createdDate later than startDate
  q = q.filter( r.row( 'createdDate' ).during( startDate, new Date() ) );

  // Filter: Include doc.article with missing attributes (doi, pmid)
  q = q.filter(
    r.row( 'article' )( 'PubmedData' )( 'ArticleIdList' ).contains({ 'IdType': 'doi' }).not()
    .or( r.row( 'article' )( 'PubmedData' )( 'ArticleIdList' ).contains({ 'IdType': 'pmid' }).not() )
  );

  q = q.orderBy( r.desc( 'createdDate' ) );
  q = q.pluck([ 'id', 'secret' ]);

  const cursor =  await q.run( conn );
  const dbJSON = await cursor.toArray();
  return Promise.all( dbJSON.map( ({ id, secret }) => loadDoc({ docDb, eleDb, id, secret }) ));
};


const updateArticle = async () => {
  try {
    const timeSinceLastUpdate = Date.now() - lastUpdateTime();
    const shouldUpdate = lastUpdateTime() == null || timeSinceLastUpdate > daysToMs( DOCUMENT_CRON_UPDATE_PERIOD_DAYS );
    if ( shouldUpdate ){
      let startDate = dateInPast( DOCUMENT_CRON_CREATED_AGE_DAYS );
      const docs = await docsToUpdate( startDate );

      for( const doc of docs ){
        const { paperId } = doc.provided();
        logger.info( `Updating article info for paperId: ${paperId}`);
        await fillDocArticle( doc, paperId );
      }
      lastUpdateTime( Date.now() );
    }
  } catch ( err ) {
    logger.error(`Error in Article update ${err}`);
  }
};

const update = async () => {
  try {
    logger.info( `Document update call received`);
    await updateArticle();
  } catch ( err ) {
    logger.error(`Error in Document update ${err}`);
  }
};

export default update;