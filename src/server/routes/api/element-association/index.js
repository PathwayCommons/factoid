const { USE_PC_GROUNDING_SEARCH } = require('../../../../config');
const aggregate = require('./aggregate');
const groundingSearch = require('./grounding-search');
const jsonifyResult = response => ( result => response.json( result ) );
const http = require('express').Router();

const provider = USE_PC_GROUNDING_SEARCH ? groundingSearch : aggregate;

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
