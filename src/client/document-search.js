import MiniSearch from 'minisearch';
import _ from 'lodash';

class Search {

  constructor( opts = {} ){
    this._engine = new MiniSearch( opts );
  }

  index( documents ){
    this._engine.addAll( documents );
  }

  search( q, limit = 10 ){
    const searchHits = this._engine.search( q );
    return searchHits.slice( 0, limit );
  }
}

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
      ],

      // fields to be stored and returned as part of the search results.
      storeFields: [
        'id',
        'citation'
      ]
    };

    const docOpts = _.defaults( opts, DEFAULT_DOCUMENT_OPTS );

    super( docOpts );
  }
}

export default DocumentSearch;
