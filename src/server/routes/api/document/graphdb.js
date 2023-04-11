import _ from 'lodash';

import logger from '../../../logger';
import { loadDoc, loadTables } from './index';
import { initDriver } from '../../../../neo4j/neo4j-driver';
import { addDocumentToNeo4j } from '../../../../neo4j';

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

export default setupGraphDbFeeds;