import * as groundingSearch from './grounding-search';
import * as indra from './indra';
import Express from 'express';

const jsonifyResult = response => ( result => response.json( result ) );
const http = Express.Router();
const nodeProvider = groundingSearch;
const intnProvider = indra;

http.post('/search', function( req, res ){
  (
    nodeProvider.search( req.body )
    .then( jsonifyResult(res) )
    .catch( err => res.status(500).send(err) )
  );
});

http.post('/get', function( req, res ){
  (
    nodeProvider.get( req.body )
    .then( jsonifyResult(res) )
    .catch( err => res.status(500).send(err) )
  );
});

http.post('/search-documents', function( req, res ){
  (
    intnProvider.searchDocuments( req.body )
    .then( jsonifyResult(res) )
    .catch( err => res.status(500).send(err) )
  );
});

// TODO: remove this just to be temporarly used for easier testing 
http.get('/search-intn', function( req, res, next ){
  let agent0 = 'TP53';
  let agent1 = 'MDM2';
  intnProvider.searchDocuments( { agent0, agent1, limit: 200, offset: 0 } )
    .then( js => res.send( js ))
    .catch( next );
});

export default http;
