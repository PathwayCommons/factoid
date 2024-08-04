import _ from 'lodash';

// Define constants for Hint types, combining ORGANISM with ENTITY_TYPE
const HINT_TYPE = Object.freeze({
  ORGANISM: 'organism'
});

// Flatten the HINT_TYPE object to create an array of all hint types
const HINT_TYPES = _.flatMap( HINT_TYPE );

// Define constants for sections of a document
const SECTION = Object.freeze({
  TITLE: 'title',
  ABSTRACT: 'abstract'
});

// Flatten the SECTION object to create an array of all sections
const SECTIONS = _.flatMap( SECTION );

/**
 * Representing a bioentity mention and ground
 */
class Hint {
  /**
   * Creates an instance of Hint.
   * @param {Array} param.texts - The texts associated with the hint.
   * @param {string} param.type - The type of the hint.
   * @param {Object} param.xref - The cross-reference (xref) object.
   * @param {string} param.section - The section of the document where the hint was found.
   */
  constructor( texts, type, xref, section ) {
    this._data = {};
    this._raw = _.assign({}, { texts, type, xref, section });
    // Initialize the properties using the setters to enforce validation
    this.texts = this._raw.texts;
    this.type = this._raw.type;
    this.xref = this._raw.xref;
    this.section = this._raw.section;
  }

  // Getter and setter for texts
  get texts() {
    return this._data.texts;
  }

  set texts( val ) {
    // Validate that texts is not empty
    if ( !val || _.isEmpty( val ) ) throw new TypeError('Invalid texts');
    this._data.texts = val;
  }

  // Getter and setter for type
  get type() {
    return this._data.type;
  }

  set type( val ) {
    // Validate that type is one of the predefined HINT_TYPES
    if ( !_.includes( HINT_TYPES, val )) throw new TypeError('Invalid type');
    this._data.type = val;
  }

  // Getter and setter for xref
  get xref() {
    return this._data.xref;
  }

  set xref( val ) {
    // Validate that xref has dbPrefix and id properties
    if (!val.dbPrefix || !val.id) throw new TypeError('Invalid xref');
    this._data.xref = val;
  }

  // Getter and setter for section
  get section() {
    return this._data.section;
  }

  set section( val ) {
    // Validate that section is one of the predefined SECTIONS
    if ( !_.includes( SECTIONS, val ) ) throw new TypeError('Invalid section');
    this._data.section = val;
  }
}

export {
  Hint,
  HINT_TYPE,
  SECTION
};
