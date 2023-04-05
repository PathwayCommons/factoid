import _ from 'lodash';

import logger from '../../../logger';
import { loadDoc, loadTables } from './index';
import { initDriver } from '../../../../neo4j/neo4j-driver';
import { addDocumentToNeo4j } from '../../../../neo4j';

const handleDocChange = async (err, item) => {

  if ( err ) logger.error('Error encountered in graph db change feeds');

  const new_val = _.get( item, ['new_val'] );
  const { id, secret } = _.pick( new_val, ['id', 'secret'] );

  const { docDb, eleDb } = await loadTables();
  const doc = await loadDoc({ docDb, eleDb, id, secret });

  try {
    await addDocumentToNeo4j( doc );
    logger.info( `Added doc to graph DB: ${doc.id()}` );

  } catch ( err ) {
    logger.error( `Failed to add doc to graph DB: ${doc.id()}` );
    logger.error( err );
  }
};

// Configure Changefeeds for the document table
const docChangefeeds = async () => {
  const docOpts = {
    includeTypes: true,
  };

  const { docDb } = await loadTables();
  const { rethink: r, conn, table } = docDb;

  // Database restore of doc with public status
  const toPublicStatusFromNull = r.row( 'new_val' )( 'status' ).eq( 'public' )
    .and( r.row( 'old_val' ).eq( null ) );
  // Status changed to 'public'
  const toPublicStatusFromOtherStatus = r.row( 'new_val' )( 'status' ).eq( 'public' )
    .and( r.row( 'old_val' )( 'status' ).ne( 'public' ) );

  const docFilter = toPublicStatusFromNull.or( toPublicStatusFromOtherStatus );

  const cursor = await table.changes( docOpts )
   .filter( docFilter )
   .run( conn );

  cursor.each( handleDocChange );
};

const tryInitDriver = async () => {
  const driver = initDriver();
  const serverInfo = await driver.getServerInfo(); // will throw if not connected
  logger.debug( `Connected to graph db at ${serverInfo.address}` );
};

/**
 * setupGraphDbFeeds
 * Set up listeners for the specified Changefeeds
 */
const setupGraphDbFeeds = async () => {
  try {
    await tryInitDriver();
    await docChangefeeds();
  } catch ( err ) { // swallow
    logger.error( `Could not connect to graph db` );
    logger.error( err );
  }
};

export default setupGraphDbFeeds;