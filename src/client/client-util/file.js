import FileSaver from 'file-saver';
import _ from 'lodash';
import { tryPromise, convertDocumentToBiopax, convertDocumentToTxt,
        convertDocumentToSbgn } from '../../util';

function exportContentToFile(content, fileName, ext){
  // if filename does not end with the extension append extension to the file name
  if( ext && !_.endsWith(fileName, ext) ){
    fileName += ext;
  }

  var file = new File([content], fileName, {type: "text/plain;charset=utf-8"});
  FileSaver.saveAs(file);
}

function exportDocumentToBiopax(docId, fileName){
  // in case document itself is given instead of document id
  if( !_.isString(docId) ){
      docId = docId.id();
  }

  fileName = fileName || docId;

  tryPromise( () => convertDocumentToBiopax(docId) )
          .then( content => exportContentToFile(content, fileName, '.owl') );
}

function exportDocumentToSbgn(docId, fileName){
  // in case document itself is given instead of document id
  if( !_.isString(docId) ){
      docId = docId.id();
  }

  fileName = fileName || docId;

  tryPromise( () => convertDocumentToSbgn(docId) )
          .then( content => exportContentToFile(content, fileName, '.sbgn.xml') );
}

function exportDocumentToTxt(docId, fileName){
  // in case document itself is given instead of document id
  if( !_.isString(docId) ){
      docId = docId.id();
  }

  fileName = fileName || docId;

  tryPromise( () => convertDocumentToTxt(docId) )
          .then( content => exportContentToFile(content, fileName, '.txt') );
}

export { exportContentToFile, exportDocumentToBiopax, exportDocumentToTxt, exportDocumentToSbgn };
