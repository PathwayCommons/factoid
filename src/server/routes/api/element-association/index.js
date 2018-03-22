const provider = require('./aggregate');
const jsonifyResult = response => ( result => response.json( result ) );
const http = require('express').Router();

http.post('/search', function( req, res ){
  (
    provider.search( req.body )
    .then( jsonifyResult(res) )
    .catch( err => res.status(500).send(err) )
  );
});

http.post('/get', function( req, res ){
  (
    provider.get( req.body )
    .then( jsonifyResult(res) )
    .catch( err => res.status(500).send(err) )
  );
});

module.exports = http;
