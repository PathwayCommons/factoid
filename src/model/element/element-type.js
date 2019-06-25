import _ from 'lodash';
import { INTERACTION_TYPE_VALS as INTERACTION_TYPE } from './interaction-type/enum';
import { ENTITY_TYPE, ENTITY_TYPES } from './entity-type';

const INTERACTION_TYPES = _.flatMap( INTERACTION_TYPE );

const ELEMENT_TYPE = Object.assign({}, ENTITY_TYPE, INTERACTION_TYPE);

const ELEMENT_TYPES = _.flatMap( ELEMENT_TYPE );

const isEntity = type => {
  return ENTITY_TYPES.indexOf(type) >= 0;
};

const isInteraction = type => {
  return INTERACTION_TYPES.indexOf(type) >= 0;
};

const isComplex = type => {
  return type == ENTITY_TYPE.COMPLEX;
};

export { ELEMENT_TYPE, ELEMENT_TYPES, isEntity, isInteraction, isComplex };
