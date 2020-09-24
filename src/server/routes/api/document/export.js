import fetch from 'node-fetch';
import JSZip from 'jszip';
import _ from 'lodash';
import fs from 'fs';

import { convertDocumentToBiopax,
        convertDocumentToJson,
        convertDocumentToSbgn,
        checkHTTPStatus } from '../../../../util';

const CHUNK_SIZE = 20;
const EXPORT_TYPES = Object.freeze({
  'JS': 'js',
  'BP': 'bp',
  'SBGN': 'sbgn'
});

const exportToZip = (baseUrl, zipPath, types) => {
  let offset = 0;
  let zip = new JSZip();

  const processNext = () => {
    return fetch(`${baseUrl}/api/document?limit=${CHUNK_SIZE}&offset=${offset}`)
      .then( checkHTTPStatus )
      .then( res => res.json() )
      .then( res => {
        offset += res.length;
        if ( res.length > 0 ) {
          const includedStatuses = ['published'];
          const shouldInclude = doc => _.includes(includedStatuses, doc.status);
          let ids = res.filter( shouldInclude ).map( doc => doc.id );
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
    let typeToConverter = {
      [EXPORT_TYPES.JSON]: convertDocumentToJson,
      [EXPORT_TYPES.BP]: convertDocumentToBiopax,
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

    const idToFiles = id => types.map( t => typeToConverter[ t ]( id, baseUrl ) );

    let promises = ids.map( idToFiles );
    promises = _.flatten( promises );

    let fileExts = types.map( t => typeToExt[ t ] );
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

export { exportToZip, EXPORT_TYPES };
