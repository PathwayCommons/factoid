// import _ from 'lodash';

import logger from '../../../logger';
import { DEMO_SECRET } from '../../../../config';
import { loadTables, loadDoc, fillDocArticle } from  './index';
// let mtime = null;

// const lastModTime = t => {
//   if( !t ){
//     return mtime;
//   } else {
//     mtime = t;
//   }
// };

const HOURS_PER_DAY = 24;
const MINUTES_PER_HOUR = 60;
const SECONS_PER_MINUTE = 60;
const MILLISECONDS_PER_SECOND = 1000;
const dateInPast = days => {
  const daysToMs = d => d * HOURS_PER_DAY * MINUTES_PER_HOUR * SECONS_PER_MINUTE * MILLISECONDS_PER_SECOND;
  const now = new Date().getTime();
  const offset = daysToMs( days );
  return new Date( now - offset );
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

const DAYS_AGO_CREATED = 1;
const updateArticle = async () => {
  try {
    let startDate = dateInPast( DAYS_AGO_CREATED );
    const docs = await docsToUpdate( startDate );
    for( const doc of docs ){
      const { paperId } = doc.provided();
      logger.info( `Updating article info for paperId: ${paperId}`);
      await fillDocArticle( doc, paperId );
    }
  } catch ( err ) {
    logger.error(`Error in Article update ${err}`);
  }
};

const update = async () => {
  try {
    await updateArticle();
  } catch ( err ) {
    logger.error(`Error in Document update ${err}`);
  }
};

export default update;