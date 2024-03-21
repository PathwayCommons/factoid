import _ from 'lodash';

import { ENTITY_TYPE } from './element/entity-type.js';

const HINT_TYPE = Object.freeze(_.assign({
  ORGANISM: 'Organism',
  DISEASE: 'disease',
  CELL_LINE: 'cellLine'
}, ENTITY_TYPE ));
const HINT_TYPES = _.flatMap( HINT_TYPE );

const PASSAGE_TYPE = Object.freeze({
  TITLE: 'title',
  ABSTRACT: 'abstract'
});
const PASSAGE_TYPES = _.flatMap( PASSAGE_TYPE );

/**
 * Representing a bioentity mention and ground
 */
class Hint {

  get text(){
    return this._text;
  }

  set text(value){
    this._text = value;
  }

  get type(){
    return this._type;
  }

  set type(value){
    if( !_.includes( HINT_TYPES, value ) ) throw new TypeError('Invalid type: ' + value);
    this._type = value;
  }

  get xref(){
    return this._xref;
  }

  set xref(value){
    if( !value.dbPrefix || !value.id ) throw new TypeError('Invalid xref: '+ JSON.stringify(value));
    this._xref = value;
  }

  get section(){
    return this._section;
  }

  set section(value){
    if( !_.includes( PASSAGE_TYPES, value ) ) throw new TypeError('Invalid section: ' + value);
    this._section = value;
  }
}

export {
  Hint,
  HINT_TYPE,
  PASSAGE_TYPE,
  PASSAGE_TYPES
};
