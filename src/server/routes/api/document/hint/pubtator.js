import _ from 'lodash';
import { Hint,
    HINT_TYPE,
} from '../../../../../model/hint.js';
import { COLLECTIONS } from '../../../../../util/registry.js';



/**
 * Map a PubTator BioCDocument to a hint
 * @param {object} bioCDocument as defined by [NLM DTD]{@link ftp://ftp.ncbi.nlm.nih.gov/pub/wilbur/BioC-PMC/BioC.dtd}
 * @returns {Array.<Hint>} hints a set of hints
 */
function map ( bioCDocument ) {
    let hints = [];
  
    // See Table 1 https://www.ncbi.nlm.nih.gov/research/pubtator3/tutorial
    const PUBTATOR_ANNOTATION_TYPE = Object.freeze({
        SPECIES: 'Species'
        // could add more types here when scope expands
    });
    const PUBTATOR_DATABASE = Object.freeze({
        ncbi_taxonomy: 'ncbi_taxonomy',
        // could add more databases here when scope expands
    });
    const entityTypes = new Map([
      [PUBTATOR_ANNOTATION_TYPE.SPECIES, HINT_TYPE.ORGANISM ]
    ]);
    const database2Xref = new Map([
      [ PUBTATOR_DATABASE.ncbi_taxonomy, COLLECTIONS.NCBI_TAXONOMY ]
    ]);

/**
 * Checks if the type of a given annotation is valid based on a predefined list of valid types.
 *
 * This function extracts the `type` field from the `infons` object of an annotation
 * and checks if this type is included in the `PUBTATOR_ANNOTATION_TYPE` array.
 *
 * @param {Object} annotation - An annotation object containing an `infons` object with metadata.
 * @returns {boolean} - Returns `true` if the `type` of the annotation is included in `PUBTATOR_ANNOTATION_TYPE`, otherwise `false`.
 */
    const isValidType = annotation => {
      const { infons: { type }} = annotation;
      return _.includes( PUBTATOR_ANNOTATION_TYPE, type );
    };

/**
 * Checks if the xref (cross-reference) of a given annotation is valid.
 *
 * This function performs a series of checks on the `identifier` field within the `infons` object of an annotation
 * to determine its validity. It checks for the presence of an identifier, ensures it is not null or undefined,
 * ensures it is not an empty string or a dash, and checks that it is not a semi-colon delimited string.
 *
 * @param {Object} annotation - An annotation object containing an `infons` object with metadata.
 * @returns {boolean} - Returns `true` if the `identifier` of the annotation passes all validation checks, otherwise `false`.
 *
 * Validation Checks:
 * - The `identifier` must exist.
 * - The `identifier` must not be null or undefined.
 * - The `identifier` must not be an empty string or a dash ('-').
 * - The `identifier` must not be a semi-colon delimited string.
 */
    const isValidXref = annotation => {
      const EMPTY_SYMBOLS = new Set(['-', '']);
      let isValid = false;
      // Check if there is an identifier
      const hasId = a => _.has( a, [ 'infons', 'identifier' ] );
      // Check if the identifier value is null or undefined
      const isNil = a => {
        const id = _.get( a, [ 'infons', 'identifier' ] );
        return  _.isNil( id );
      };
      // Check if the identifier value is empty or a dash
      const isEmpty = a => {
        const id = _.get( a, [ 'infons', 'identifier' ] );
        return EMPTY_SYMBOLS.has( id );
      };
      // Check if the identifier value is semi-colon delimited
      const isSemiColonDelimited = a => {
        const id = _.get( a, [ 'infons', 'identifier' ] );
        const ids = _.compact( id.split(';') );
        return ids.length > 1;
      };
      if( hasId( annotation )
          && !isNil( annotation )
          && !isEmpty( annotation )
          && !isSemiColonDelimited( annotation ) ){
        isValid = true;
      }
      return isValid;
    };
  
/**
 * Groups a list of annotation objects by their database and identifier (xref) fields.
 *
 * This function processes an array of annotations, grouping them based on a composite key
 * created from the `database` and `identifier` fields in the `infons` object of each annotation.
 * After grouping, it transforms each group into an object containing the `infons` from the first
 * annotation in the group and an array of all `text` fields from the annotations in that group.
 *
 * @param {Array} annotations - An array of annotation objects, each containing an `infons` object with metadata and a `text` field.
 * @returns {Array} - An array of objects, where each object contains:
 *                    - `infons`: The metadata from the first annotation in the group.
 *                    - `texts`: An array of `text` fields from all annotations in the group.
 *
 */
    const groupByXref = annotations => {
        const byXref = ({ infons }) => `${infons.database}_${infons.identifier}`;
        let groups = _.groupBy( annotations, byXref );
        groups = Object.values( groups ).map( group => {
          const texts = group.map( a => a.text );
          const first = _.first( group );
          const core = _.pick( first, [ 'infons' ]);
          return _.assign( core, { texts } );
        });
        return groups;
      };

/**
 * Converts an annotation object into a Hint object.
 *
 * This function extracts relevant fields from an annotation object and constructs a new Hint object.
 * It retrieves the identifier, database, and type from the `infons` object of the annotation, maps the database to an xref,
 * and maps the type to an entity type. It then creates a new Hint object using these extracted and mapped values, along with the provided section.
 *
 * @param {Object} annotation - An annotation object containing `infons` and `texts` fields.
 * @param {string} section - A string representing the section of the document where the annotation was found. e.g., 'title' or 'abstract'.
 * @returns {Hint} - Returns a new Hint object constructed from the annotation data and section.
 */
      const toHint = ( annotation, section ) => {
        // Destructure the relevant fields from the annotation
        const { texts, infons: { identifier: id, database, type } } = annotation;
        // Assign the id, dbName, and dbPrefix to an xref object
        const xref = _.assign({ id }, database2Xref.get( database ));
        // Map the type to an entity type
        const eType = entityTypes.get( type );  
        // Create a new Hint object with the extracted and mapped values
        const hint = new Hint( texts, eType, xref, section );

        return hint;
      };
  
    let { passages } = bioCDocument;
  
    for (const passage of passages) {
        
        let { annotations } = passage;
        const section = passage.infons.type; 
        annotations = _.filter( annotations, isValidType ); 
        annotations = _.filter( annotations, isValidXref );
        annotations = groupByXref( annotations );
        annotations.forEach( a => {
            const hint = toHint( a, section );
            hints.push( hint );
        });
      }
    return hints;
  }

export default map;
