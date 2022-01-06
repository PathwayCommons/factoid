import fetch from 'node-fetch';
import JSZip from 'jszip';
import _ from 'lodash';
import fs from 'fs';
import util from 'util';
import addMilliseconds from 'date-fns/addMilliseconds';
import formatDistance from 'date-fns/formatDistance';

import logger from '../../../logger';
import db from '../../../db';
import Document from '../../../../model/document';

import { convertDocumentToBiopax,
        convertDocumentToJson,
        convertDocumentToSbgn } from '../../../document-util';

import { checkHTTPStatus } from '../../../../util';
import {
  PORT,
  BULK_DOWNLOADS_PATH,
  BIOPAX_DOWNLOADS_PATH,
  EXPORT_BULK_DELAY_HOURS,
  BIOPAX_IDMAP_DOWNLOADS_PATH} from '../../../../config';

const DOCUMENT_STATUS_FIELDS = Document.statusFields();
const CHUNK_SIZE = 20;
const EXPORT_TYPES = Object.freeze({
  'JS': 'json',
  'BP': 'biopax',
  'SBGN': 'sbgn'
});

const exportToZip = (baseUrl, zipPath, types, biopaxIdMapping) => {
  let offset = 0;
  let zip = new JSZip();

  const processNext = () => {
    return fetch(`${baseUrl}/api/document?limit=${CHUNK_SIZE}&offset=${offset}&status=public`)
      .then( checkHTTPStatus )
      .then( res => res.json() )
      .then( res => {
        offset += res.length;
        if ( res.length > 0 ) {
          const includedStatuses = [DOCUMENT_STATUS_FIELDS.PUBLIC];
          const shouldInclude = doc => _.includes(includedStatuses, doc.status);
          let ids = res.filter( shouldInclude ).map( doc => doc.id );
          return addToZip( ids, biopaxIdMapping ).then( processNext );
        }

        return writeZip();
      } );
  };

  const writeZip = () => {
    return new Promise( resolve => {
      zip.generateNodeStream({streamFiles:true})
          .pipe(fs.createWriteStream(zipPath))
          .on('finish', resolve);
    } );
  };

  const addToZip = ( ids, biopaxIdMapping ) => {
    let _convertDocumentToBiopax = ( id, baseUrl ) => convertDocumentToBiopax( id, baseUrl, biopaxIdMapping );
    let typeToConverter = {
      [EXPORT_TYPES.JSON]: convertDocumentToJson,
      [EXPORT_TYPES.BP]: _convertDocumentToBiopax,
      [EXPORT_TYPES.SBGN]: convertDocumentToSbgn
    };

    let typeToExt = {
      [EXPORT_TYPES.JSON]: '.json',
      [EXPORT_TYPES.BP]: '.owl',
      [EXPORT_TYPES.SBGN]: '.sbgn.xml'
    };

    // convert to each type by default
    if ( !types ) {
      types = Object.keys( typeToConverter );
    }

    const idToFiles = id => types.map( t => {
      return typeToConverter[ t ]( id, baseUrl )
              .catch( () => {
                logger.error(`Error in export: cannot convert the document ${id} into ${t}`);
                return null;
              } );
    } );

    let promises = ids.map( idToFiles );
    promises = _.flatten( promises );

    let fileExts = types.map( t => typeToExt[ t ] );
    let s = fileExts.length;

    return Promise.all( promises )
      .then( contents => {
        contents.forEach( ( content, i ) => {
          if ( content != null ) {
            let id = ids[ Math.floor( i / s ) ];
            let ext = fileExts[ i % s ];
            let fileName = id + ext;

            zip.file( fileName, content );
          }
        } );
      } );
  };

  return processNext();
};

/**
 * scheduleTask
 * Schedule a task in 'delay' ms. Ignore additional requests while scheduled.
 *
 * @param {object} task The task to execute
 * @param {number} delay ms delay for task execution (default 0)
 * @param {object} next The callback to run after a task is initiated
 */
const taskScheduler = ( task, delay = 0, next = () => {} ) => {
  let taskScheduled = false;
  let taskTime = null;
  const resetTaskSchedule = () => { taskScheduled = false; taskTime = null; };

  return (() => {
    const setTimeoutPromise = util.promisify( setTimeout );
    let now = new Date();
    logger.info( `A task request has been received` );

    if( taskScheduled ){
      logger.info( `A task has already been scheduled for ${taskTime} (${formatDistance( now, taskTime )})` );

    } else {
      taskTime = addMilliseconds( new Date(), delay );
      logger.info( `A task was scheduled for ${taskTime} (${formatDistance( now, taskTime )})` );
      taskScheduled = true;

      setTimeoutPromise( delay )
        .then( task )
        .then( next )
        .catch( () => {} ) // swallow
        .finally( resetTaskSchedule ); // allow another backup request
    }

    return Promise.resolve();
  });
};

// Configure Changefeeds for the document table
const setupChangefeeds = async ({ rethink: r, conn, table }) => {
  const docOpts = {
    includeTypes: true,
    squash: true
   };

  // Database restore of doc with public status
  const toPublicStatusFromNull = r.row( 'new_val' )( 'status' ).eq( 'public' )
    .and( r.row( 'old_val' ).eq( null ) );
  // Status changed to 'public'
  const toPublicStatusFromOtherStatus = r.row( 'new_val' )( 'status' ).eq( 'public' )
    .and( r.row( 'old_val' )( 'status' ).ne( 'public' ) );
  // Status is changed from 'public'
  const toOtherStatusFromPublicStatus = r.row( 'new_val' )( 'status' ).ne( 'public' )
    .and( r.row( 'old_val' )( 'status' ).eq( 'public' ) );

  const docFilter = toPublicStatusFromNull.or( toPublicStatusFromOtherStatus ).or( toOtherStatusFromPublicStatus );
  const cursor = await table.changes( docOpts )
   .filter( docFilter )
   .run( conn );
  return cursor;
};

/**
* initExportTasks
* Initialize the export tasks
*/
const initExportTasks = async () => {
  const MS_PER_SEC = 1000;
  const SEC_PER_MIN = 60;
  const MIN_PER_HOUR = 60;
  const baseUrl = `http://localhost:${PORT}`; // ever not localhost?

  const loadTable = name => db.accessTable( name );
  const dbTable = await loadTable( 'document' );
  const cursor = await setupChangefeeds( dbTable );

  let export_delay = MS_PER_SEC * SEC_PER_MIN * MIN_PER_HOUR * EXPORT_BULK_DELAY_HOURS;
  let delay_shift = 2;

  const exportTask = () => exportToZip( baseUrl, BULK_DOWNLOADS_PATH );
  const doExport = taskScheduler( exportTask, export_delay );

  const exportBiopaxTask = () => exportToZip( baseUrl, BIOPAX_DOWNLOADS_PATH, [ EXPORT_TYPES.BP ], false );
  const doExportBiopax = taskScheduler( exportBiopaxTask, export_delay * delay_shift );
  const exportBiopaxIdMapTask = () => exportToZip( baseUrl, BIOPAX_IDMAP_DOWNLOADS_PATH, [ EXPORT_TYPES.BP ], true );
  const doExportBiopaxIdMap = taskScheduler( exportBiopaxIdMapTask, export_delay * delay_shift );

  cursor.each( async err => {
    if( err ){
      logger.error( `Error in Changefeed: ${err}` );
      return;
    }
    await doExport();
    await doExportBiopax();
    await doExportBiopaxIdMap();
  });
};


export { exportToZip, EXPORT_TYPES, initExportTasks };
