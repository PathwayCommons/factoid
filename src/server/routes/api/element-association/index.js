const provider = require('./aggregate');
const jsonifyResult = response => ( result => response.json( result ) );
const http = require('express').Router();

http.get('/search', function( req, res ){
  (
    provider.search( req.query )
    .then( jsonifyResult(res) )
    .catch( err => res.status(500).send(err) )
  );
});

http.get('/get', function( req, res ){
  (
    provider.get( req.query )
    .then( jsonifyResult(res) )
    .catch( err => res.status(500).send(err) )
  );
});

module.exports = http;
