import fetch from 'node-fetch';
import JSZip from 'jszip';
import _ from 'lodash';
import fs from 'fs';

import { convertDocumentToBiopax,
        convertDocumentToTxt,
        convertDocumentToJson,
        convertDocumentToSbgn,
        checkHTTPStatus } from '../../../../util';

const CHUNK_SIZE = 20;

const exportToZip = (baseUrl, zipPath) => {
  let offset = 0;
  let zip = new JSZip();

  const processNext = () => {
    return fetch(`${baseUrl}/api/document?limit=${CHUNK_SIZE}&offset=${offset}`)
      .then( checkHTTPStatus )
      .then( res => res.json() )
      .then( res => {
        offset += res.length;
        if ( res.length > 0 ) {
          let ids = res.map( doc => doc.id );
          return addToZip( ids ).then( processNext );
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

  const addToZip = ids => {
    let promises = ids.map( id => [ convertDocumentToBiopax(id, baseUrl),
                                    convertDocumentToJson(id, baseUrl),
                                    convertDocumentToSbgn(id, baseUrl) ] );
    promises = _.flatten( promises );

    let fileExts = ['.owl', '.json', 'sbgn.xml'];
    let s = fileExts.length;

    return Promise.all( promises )
      .then( contents => {
        contents.forEach( ( content, i ) => {
          let id = ids[ Math.floor( i / s ) ];
          let ext = fileExts[ i % s ];
          let fileName = id + ext;

          zip.file( fileName, content );
        } );
      } );
  };

  return processNext();
};

export { exportToZip };
