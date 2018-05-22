const FileSaver = require('file-saver');

function exportContentToFile(content, fileName){
  var file = new File([content], fileName, {type: "text/plain;charset=utf-8"});
  FileSaver.saveAs(file);
}

function exportContentToOwl(content, fileName){
  if(!fileName.endsWith('.owl')){
    fileName += '.owl';
  }

  exportContentToFile(content, fileName);
}

function exportDocumentToOwl(doc, fileName){
  let templates = doc.toBiopaxTemplates();

  let makeRequest = () => fetch('/api/document/convert-to-biopax', {
    headers: {
      'Content-Type': 'application/json'
    },
    method: 'POST',
    body: JSON.stringify(templates)
  });

  fileName = fileName || doc.id();

  Promise.try( makeRequest ).then( result => result.text() )
          .then( content => exportContentToOwl(content, fileName) );
}

module.exports = { exportContentToFile, exportContentToOwl, exportDocumentToOwl };
