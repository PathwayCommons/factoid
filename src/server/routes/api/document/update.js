import _ from 'lodash';

import Document from '../../../../model/document';
import db from '../../../db';
import logger from '../../../logger';
import { DEMO_SECRET } from '../../../../config';

// let mtime = null;
let tables = ['document', 'element'];

let loadTable = name => db.accessTable( name );

let loadTables = () => Promise.all( tables.map( loadTable ) ).then( dbInfos => ({
  docDb: dbInfos[0],
  eleDb: dbInfos[1]
}) );

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
  const daysToMs = d => d*HOURS_PER_DAY*MINUTES_PER_HOUR*SECONS_PER_MINUTE*MILLISECONDS_PER_SECOND;
  const now = new Date().getTime();
  const offset = daysToMs( days );
  return new Date( now - offset );
};

const docsToUpdate = async startDate => {

  const tables = await loadTables();
  const { docDb, eleDb } = tables;
  let { table: q, conn, rethink: r } = docDb;

  // Exclude DEMO
  q = q.filter( r.row( 'secret' ).ne( DEMO_SECRET ) );

  // Created after startDate
  q = q.filter( r.row( 'createdDate' ).during( startDate, new Date() ) );

  q = q.orderBy( r.desc( 'createdDate' ) );
  q = q.pluck([ 'id', 'secret' ]);

  const cursor =  await q.run( conn );
  const dbJSON = await cursor.toArray();
  return Promise.all( dbJSON.map( ({ id, secret }) => loadDoc({ docDb, eleDb, id, secret }) ));
};

const DAYS_AGO_CREATED = 1;
const updateArticle = async () => {
  try {
    logger.info(`updateArticle triggered`);
    let startDate = dateInPast( DAYS_AGO_CREATED );
    const docs = await docsToUpdate( startDate );
    docs.map( d => { logger.info( d.id() ); } );

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