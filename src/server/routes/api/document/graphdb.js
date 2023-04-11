import _ from 'lodash';

import logger from '../../../logger';
import { loadDoc, loadTables } from './index';
import { initDriver } from '../../../../neo4j/neo4j-driver';
import { addDocumentToNeo4j } from '../../../../neo4j';
import Document from '../../../../model/document';
import { guaranteeSession } from '../../../../neo4j/neo4j-driver';

const DOCUMENT_STATUS_FIELDS = Document.statusFields();

const handleDocChange = async (err, item) => {

  if ( err ){
    logger.error('Error encountered in db');
    return;
  }

  try {
    const new_val = _.get( item, ['new_val'] );
    const { id, secret } = _.pick( new_val, ['id', 'secret'] );
    const { docDb, eleDb } = await loadTables();
    const doc = await loadDoc({ docDb, eleDb, id, secret });
    await addDocumentToNeo4j( doc );
    logger.info( `Added doc to graph DB: ${doc.id()}` );
  } catch ( err ) { // swallow
    logger.error( 'Failed to add doc to graph DB' );
    logger.error( err );
  }
};

// Configure Changefeeds for the document table
const docChangefeeds = async () => {
  const docOpts = {
    includeTypes: true,
  };

  try {
    const { docDb } = await loadTables();
    const { rethink: r, conn, table } = docDb;

    // Status changed to 'public'
    const toPublicStatusFromOtherStatus = r.row( 'new_val' )( 'status' ).eq( 'public' )
      .and( r.row( 'old_val' )( 'status' ).ne( 'public' ) );

    const docFilter = toPublicStatusFromOtherStatus;

    const cursor = await table.changes( docOpts )
     .filter( docFilter )
     .run( conn );

    return cursor;
  } catch ( err ) { //swallow
    logger.error( 'Failed to add docChangeFeeds' );
    logger.error( err );
  }
};

const tryInitDriver = async () => {
  let serverInfo = null;
  try {
    const driver = initDriver();
    serverInfo = await driver.getServerInfo(); // throw Neo4JError if not connected
    const { address, agent } = serverInfo;
    logger.debug( `Connected to graph db: ${address} [${agent}]` );
    return serverInfo;
  } catch ( err ) {
    logger.error( 'Unable to access graph db' );
    return serverInfo;
  }
};

/**
 * setupGraphDbFeeds
 * Set up listeners for the specified Changefeeds
 */
const setupGraphDbFeeds = async () => {
  const serverInfo = await tryInitDriver();
  if( !serverInfo ) return;

  const cursor = await docChangefeeds();
  cursor.each( handleDocChange );
};


let mtime = null; // milliseconds
const lastUpdateTime = t => {
  if( !t ){
    return mtime;
  } else {
    mtime = t;
  }
};

const docsToRefresh = async () => {
  const tables = await loadTables();
  const { docDb, eleDb } = tables;
  let { table: q, conn, rethink: r } = docDb;

  // Filter: Include status 'public'
  q = q.filter( r.row( 'status' ).eq( DOCUMENT_STATUS_FIELDS.PUBLIC ) );
  q = q.pluck([ 'id', 'secret' ]);

  const cursor =  await q.run( conn );
  const dbJSON = await cursor.toArray();
  return Promise.all( dbJSON.map( ({ id, secret }) => loadDoc({ docDb, eleDb, id, secret }) ));
};

const populateGraphDb = async () => {
  logger.debug( `Calling populateGraphDb` );

  try {
    const docs = await docsToRefresh();
    for ( const doc of docs ) {
      await addDocumentToNeo4j( doc );
    }
  } catch ( err ) { // swallow
    logger.error( 'Failed to populate graph DB from factoid' );
    logger.error( err );
  }
};

const clearGraphDb = async () => {
  logger.debug( `Calling clearGraphDb` );
  // replace with something like 'deleteAllNodesAndEdges'
  let session;
  try {
    session = guaranteeSession();
    await session.executeWrite(tx => {
      return tx.run(`MATCH (n) DETACH DELETE n`);
    });
  } catch (error) {
    throw error;
  } finally {
    await session.close();
  }
  return;
};

/**
 * refresh
 *
 * Refresh the Graph DB with factoid data
 *
 * @param {Number} refreshPeriodMinutes The time, in minutes, between successive refreshes
 */
export const refreshGraphDB = async refreshPeriodMinutes => {
  const SECONDS_PER_MINUTE = 60;
  const MILLISECONDS_PER_SECOND = 1000;
  const minutesToMs = m => m * SECONDS_PER_MINUTE * MILLISECONDS_PER_SECOND;

  try {
    let shouldRefresh = false;
    if( lastUpdateTime() == null ){
      shouldRefresh = true;
    } else {
      const timeSinceLastUpdate = Date.now() - lastUpdateTime();
      shouldRefresh = timeSinceLastUpdate > minutesToMs( refreshPeriodMinutes );
    }

    logger.debug( `Checking Graph DB refresh status: ${shouldRefresh}` );

    if ( shouldRefresh ){
      await clearGraphDb();
      await populateGraphDb();
    }
  } catch ( err ) {
    logger.error(`Error in Document update ${err}`);
  }
};

export default setupGraphDbFeeds;