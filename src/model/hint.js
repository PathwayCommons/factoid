import _ from 'lodash';

import { ENTITY_TYPE } from './element/entity-type.js';

const HINT_TYPE = Object.freeze(_.assign({
  ORGANISM: 'organism',
  DISEASE: 'disease',
  CELL_LINE: 'cellLine',
  VARIANT: 'variant'
}, ENTITY_TYPE ));
const HINT_TYPES = _.flatMap( HINT_TYPE );

const SECTION = Object.freeze({
  TITLE: 'title',
  ABSTRACT: 'abstract'
});
const SECTIONS = _.flatMap( SECTION );

/**
 * Representing a bioentity mention and ground
 */
class Hint {

  constructor({ texts, type, xref, section }) {
    this._data = {};
    this._raw = _.assign({}, { texts, type, xref, section });

    this.texts = this._raw.texts;
    this.type = this._raw.type;
    this.xref = this._raw.xref;
    this.section = this._raw.section;
  }

  get texts() {
    return this._data.texts;
  }

  set texts( val ) {
    if( !val || _.isEmpty( val ) ) throw new TypeError('Invalid texts');
    this._data.texts = val;
  }

  get type() {
    return this._data.type;
  }

  set type( val ) {
    if( !_.includes( HINT_TYPES, val ) ) throw new TypeError('Invalid type');
    this._data.type = val;
  }

  get xref() {
    return this._data.type;
  }

  set xref( val ) {
    if( !val.dbPrefix || !val.id ) throw new TypeError('Invalid xref');
    this._data.xref = val;
  }

  get section() {
    return this._data.section;
  }

  set section( val ) {
    if( !_.includes( SECTIONS, val ) ) throw new TypeError('Invalid section');
    this._data.section = val;
  }

}

export {
  Hint,
  HINT_TYPE,
  SECTION,
  SECTIONS
};
