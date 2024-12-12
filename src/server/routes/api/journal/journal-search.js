import MiniSearch from 'minisearch';
import _ from 'lodash';

// import logger from '../../../logger.js';
import data from './scimago_2023.json';

/** Class for  searching an index. */
class JournalSearch {

  constructor( opts = {} ){
    this._engine = new MiniSearch( _.assign( {}, opts, { storeFields: [ 'id' ] } ) );
    this._documents = [];
    this._docMap = new Map();
  }

  /**
   * Load documents into the index and stash locally
   * @param {object} documents List of raw documents to index
   */
  index( documents ){
    this._engine.addAll( documents );
    this._documents = documents;
    this._documents.forEach( doc => this._docMap.set( doc.id, doc ) );
  }

  /**
   * Getter for list of raw documents indexed
   */
  get documents() {
    return this._documents;
  }

  /**
   * Search the index
   * @param {string} q search query
   * @param {number} limit maximum number of hits to return (default 10)
   * @return {object} a list of search hits (raw document)
   */
  search( q, limit = 10 ){
    let searchHits = this._engine.search( q );
    searchHits = searchHits.slice( 0, limit );
    return searchHits.map( ({ id }) => this._docMap.get( id ) );
  }
}

const opts = {
  fields: ['title'],
  fuzzy: true
};
const journalSearch = new JournalSearch(opts);
journalSearch.index( data );

export default journalSearch;