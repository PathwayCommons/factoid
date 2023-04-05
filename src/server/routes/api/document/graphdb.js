import _ from 'lodash';

import logger from '../../../logger';
import { loadDoc, loadTables } from './index';
import { initDriver } from '../../../../neo4j/neo4j-driver';
import { addDocumentToNeo4j } from '../../../../neo4j';

const handleDocChange = async (err, item) => {
  const new_val = _.get( item, ['new_val'] );
  const { id, secret } = _.pick( new_val, ['id', 'secret'] );

  const { docDb, eleDb } = await loadTables();
  const doc = await loadDoc({ docDb, eleDb, id, secret });
  logger.debug( `doc id: ${doc.id()}` );
  await addDocumentToNeo4j( doc );
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

/**
 * setupGraphDbFeeds
 * Set up listeners for the specified Changefeeds
 */
const setupGraphDbFeeds = async () => {
  initDriver();
  await docChangefeeds();
};

export default setupGraphDbFeeds;