const provider = require('./uniprot');
const jsonifyResult = response => ( result => response.json( result ) );
const http = require('express').Router();

http.get('/search', function( req, res ){
  provider.search( req.query ).then( jsonifyResult(res) );
});

http.get('/get', function( req, res ){
  provider.get( req.query ).then( jsonifyResult(res) );
});

module.exports = http;
