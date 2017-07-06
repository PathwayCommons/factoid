const provider = require('./uniprot');
const jsonifyResult = response => ( result => response.json( result ) );

module.exports = function( http ){
  http.get('/element-association/search', function( req, res ){
    provider.search( req.query ).then( jsonifyResult(res) );
  });

  http.get('/element-association/get', function( req, res ){
    provider.get( req.query ).then( jsonifyResult(res) );
  });
};
