import DataComponent from './data-component';
import MiniSearch from 'minisearch';
import _ from 'lodash';

// const DEFAULT_FIELDS = [
//   'text'
// ];

class SearchComponent extends DataComponent {
  constructor(props){
    super(props);

    this.searchOpts = _.assign( {}, _.get( this.props, 'searchOpts' ) );

    this.index = new MiniSearch({
      fields: [ // fields to index for full-text search
        'text',
        'citation.title',
        'citation.authors.abbreviation',
        'citation.reference',
        'citation.abstract',
        'entities'
        // ,
        // 'interactions'
      ],
      storeFields: [ // fields to return with search results
        'id',
        'citation'
      ],
      extractField: ( document, fieldName ) => {

        // customize field extraction
        // const isInteraction = el => el.type === 'interaction';
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
        // else if ( fieldName === 'interactions' ) {
        //   const { elements } = document;
        //   const interactions = elements.filter( isInteraction );
        //   const interactionNames = interactions.map( interaction => {
        //     const { association } = interaction;
        //     const tokens = [ name ];

        //     if( association != null ){
        //       const assocNames = _.concat( _.get( association, 'name' ), _.get( association, 'synonyms' ) );
        //       tokens.push( assocNames );
        //     }

        //     return _.join( _.compact( tokens ), ' ' );
        //   });

        //   return entityNames;
        // }

        // Access nested fields
        return fieldName.split('.').reduce( ( doc, key ) => doc && doc[ key ], document );
      }
    });
  }

  index( documents ){
    this.index.addAll( documents );
  }

  search( q ){
    return this.index.search( q, this.searchOpts );
  }
}

export default SearchComponent;
