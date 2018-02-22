const queryString = require('query-string');

const toJson = res => res.json();

module.exports = {
  createDoc( text ){
    return fetch('/api/document', {
      headers: {
        'Content-Type': 'application/json'
      },
      method: 'POST',
      body: JSON.stringify({ text })
    }).then( toJson );
  },
  getDoc( id ){
    return fetch(`/api/document/${id}`).then( toJson );
  },
  queryElementAssociation( query ){
    return fetch( '/api/element-association/search?' + queryString.stringify( query ) ).then( toJson );
  },
  getElementAssociation( query ){
    return fetch('/api/element-association/get?' + queryString.stringify( query ) ).then( toJson );
  }
};