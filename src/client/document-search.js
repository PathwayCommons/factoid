import MiniSearch from 'minisearch';
import _ from 'lodash';
import querystring from 'querystring';

import logger from './logger';

/** Class for  searching an index. */
class Search {

  constructor( opts = {} ){
    this._engine = new MiniSearch( _.assign( {}, opts, { storeFields: [ 'id' ] } ) );
    this._documents = [];
    this._docMap = new Map();
  }

  /**
   * Fetch documents from source and index
   * @param {string} url location to retrieve documents from
   * @param {number} limit max documents to retrieve
   * @param {number} offset starting index for documents to retrieve
   * @return {object} a list of full Document JSON
   */
  fetch( url, limit = 50, offset = 0 ){
    const opts = { limit, offset };
    let addr = `${url}?${querystring.stringify( opts )}`;

    return fetch( addr )
      .then( res => res.json() )
      .then( docs => this.index( docs ) )
      .then( () => this.documents )
      .catch( err => {
        logger.error( `Unable to load documents from ${url}` );
        logger.error( err );
      });
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

/** Class for searching Document objects. */
class DocumentSearch extends Search {

  constructor( opts ) {
    const DEFAULT_DOCUMENT_OPTS = {
      // function used to get the value of a field in a document
      extractField: ( document, fieldName ) => {

        // customize field extraction
        const isEntity = el => el.type !== 'interaction';

        if ( fieldName === 'entities' ) {
          const { elements } = document;
          const entities = elements.filter( isEntity );
          const entityNames = entities.map( entity => {
            const { name, association } = entity;
            const tokens = [ name ];

            if( association != null ){
              const assocNames = _.concat( _.get( association, 'name' ), _.get( association, 'synonyms' ) );
              tokens.push( assocNames );
            }

            return _.join( _.compact( tokens ), ' ' );
          });

          return entityNames;
        }

        // Access nested fields
        return fieldName.split('.').reduce( ( doc, key ) => doc && doc[ key ], document );
      },

      // fields to be indexed
      fields: [
        'text',
        'citation.title',
        'citation.authors.abbreviation',
        'citation.reference',
        'citation.abstract',
        'entities'
      ]
    };

    const docOpts = _.defaults( opts, DEFAULT_DOCUMENT_OPTS );

    super( docOpts );
  }

}

export default DocumentSearch;
