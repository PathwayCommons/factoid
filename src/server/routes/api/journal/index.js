import journalSearch from './journal-search.js';
import Express from 'express';

const jsonifyResult = response => ( result => response.json( result ) );
const http = Express.Router();
const provider = journalSearch;

http.post('/search', function( req, res ){
  const { q, limit } = req.body;
  (
    Promise.resolve()
    .then( () => provider.search( q, limit ) )
    .then( jsonifyResult(res) )
    .catch( err => res.status(500).send(err) )
  );
});

export default http;
