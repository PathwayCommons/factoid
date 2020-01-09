import FileSaver from 'file-saver';
import _ from 'lodash';
import { tryPromise } from '../../util';

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

  let makeRequest = () => fetch(`/api/document/biopax/${docId}`);

  fileName = fileName || docId;

  tryPromise( makeRequest ).then( result => result.text() )
          .then( content => exportContentToFile(content, fileName, '.owl') );
}

function exportDocumentToSbgn(docId, fileName){
  // in case document itself is given instead of document id
  if( !_.isString(docId) ){
    docId = docId.id();
  }

  let makeRequest = () => fetch(`/api/document/sbgn/${docId}`);

  fileName = fileName || docId;

  tryPromise( makeRequest ).then( result => result.text() )
    .then( content => exportContentToFile(content, fileName, '.sbgn.xml') );
}

function exportDocumentToTxt(docId, fileName){
  // in case document itself is given instead of document id
  if( !_.isString(docId) ){
      docId = docId.id();
  }

  let makeRequest = () => fetch(`/api/document/text/${docId}`);

  fileName = fileName || docId;

  tryPromise( makeRequest ).then( result => result.text() )
          .then( content => exportContentToFile(content, fileName, '.txt') );
}

export { exportContentToFile, exportDocumentToBiopax, exportDocumentToTxt, exportDocumentToSbgn };
