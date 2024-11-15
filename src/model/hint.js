import _ from 'lodash';
import { ENTITY_TYPE } from './element/entity-type.js';

// Define constants for Hint types, combining ORGANISM with ENTITY_TYPE
const HINT_TYPE = Object.freeze(
  _.assign(
    {
      ORGANISM: 'organism',
      DISEASE: 'disease',
      CELL_LINE: 'cell_line',
      VARIANT: 'variant',
    },
    ENTITY_TYPE,
  ),
);

// Flatten the HINT_TYPE object to create an array of all hint types
const HINT_TYPES = _.flatMap(HINT_TYPE);

// Define constants for sections of a document
const SECTION = Object.freeze({
  TITLE: 'title',
  ABSTRACT: 'abstract',
});

// Flatten the SECTION object to create an array of all sections
const SECTIONS = _.flatMap(SECTION);

/**
 * Representing a bioentity mention and ground
 */
class Hint {
  /**
   * Creates an instance of Hint.
   * @param {Array} texts - The texts associated with the hint.
   * @param {string} type - The type of the hint.
   * @param {Object} xref - The cross-reference (xref) object.
   * @param {string} section - The section of the document where the hint was found.
   */
  constructor(texts, type, xref, section) {
    // Use setters to initialize properties and enforce validation
    this.texts = texts;
    this.type = type;
    this.xref = xref;
    this.section = section;
  }

  // Getter and setter for texts
  get texts() {
    return this._texts;
  }

  set texts(val) {
    // Validate that texts is not empty
    if (!val || _.isEmpty(val)) throw new TypeError('Invalid texts');
    this._texts = val;
  }

  // Getter and setter for type
  get type() {
    return this._type;
  }

  set type(val) {
    // Validate that type is one of the predefined HINT_TYPES
    if (!_.includes(HINT_TYPES, val)) throw new TypeError('Invalid type');
    this._type = val;
  }

  // Getter and setter for xref
  get xref() {
    return this._xref;
  }

  set xref(val) {
    // Validate that xref has dbPrefix and id properties
    if (!val.dbPrefix || !val.id) throw new TypeError('Invalid xref');
    this._xref = val;
  }

  // Getter and setter for section
  get section() {
    return this._section;
  }

  set section(val) {
    // Validate that section is one of the predefined SECTIONS
    if (!_.includes(SECTIONS, val)) throw new TypeError('Invalid section');
    this._section = val;
  }
}

export { Hint, HINT_TYPE, SECTION };
