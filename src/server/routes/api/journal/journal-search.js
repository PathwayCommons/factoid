import lunr from 'lunr';

import data from './scimago_2023.json';

/** Class for  searching an index. */
class JournalSearch {

  constructor(){
    this._engine;
    this._documents = [];
    this._docMap = new Map();
  }

  /**
   * Load documents into the index and stash locally
   * @param {object} documents List of raw documents to index
   */
  index( documents ){
    this._engine = lunr(function () {
      this.ref('id');
      this.field('title');

      documents.forEach(function (doc) {
        this.add(doc);
      }, this);
    });
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
    const qTransform = q => {
      return `${q}~1`; // fuzzy
    };
    q = qTransform( q );
    let searchHits = this._engine.search( q );
    searchHits = searchHits.slice( 0, limit );
    return searchHits.map( ({ ref: id }) => this._docMap.get( parseInt( id ) ) );
  }
}

const journalSearch = new JournalSearch();
journalSearch.index( data );

export default journalSearch;