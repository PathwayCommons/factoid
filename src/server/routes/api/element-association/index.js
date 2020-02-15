import * as groundingSearch from './grounding-search';
import * as indraIntreaction from './indra-interaction';
import Express from 'express';

const jsonifyResult = response => ( result => response.json( result ) );
const http = Express.Router();
const nodeProvider = groundingSearch;
const intnProvider = indraIntreaction

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

http.post('/search-intn', function( req, res ){
  (
    intnProvider.search( req.body )
    .then( jsonifyResult(res) )
    .catch( err => res.status(500).send(err) )
  )
});

export default http;
