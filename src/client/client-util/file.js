const FileSaver = require('file-saver');
const _ = require('lodash');
const { tryPromise } = require('../../util');

function exportContentToFile(content, fileName){
  var file = new File([content], fileName, {type: "text/plain;charset=utf-8"});
  FileSaver.saveAs(file);
}

function exportContentToOwl(content, fileName){
  if( !_.endsWith(fileName, '.owl') ){
    fileName += '.owl';
  }

  exportContentToFile(content, fileName);
}

function exportDocumentToOwl(docId, fileName){
  // in case document itself is given instead of document id
  if( !_.isString(docId) ){
      docId = docId.id();
  }

  let makeRequest = () => fetch(`/api/document/biopax/${docId}`);

  fileName = fileName || docId;

  tryPromise( makeRequest ).then( result => result.text() )
          .then( content => exportContentToOwl(content, fileName) );
}

module.exports = { exportContentToFile, exportContentToOwl, exportDocumentToOwl };
