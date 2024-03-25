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

  constructor( text, type, xref, section ) {
    this.text = text;

    if( !_.includes( HINT_TYPES, type ) ) throw new TypeError('Invalid type: ' + type );
    this.type = type;

    if( !xref.dbPrefix || !xref.id ) throw new TypeError('Invalid xref: '+ JSON.stringify( xref ) );
    this.xref = xref;

    if( !_.includes( PASSAGE_TYPES, section ) ) throw new TypeError('Invalid section: ' + section );
    this.section = section;
  }
}

export {
  Hint,
  HINT_TYPE,
  PASSAGE_TYPE,
  PASSAGE_TYPES
};
