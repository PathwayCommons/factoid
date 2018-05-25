const _ = require('lodash');
const { INTERACTION_TYPE_VALS: INTERACTION_TYPE } = require('./interaction-type/enum');
const { ENTITY_TYPE, ENTITY_TYPES } = require('./entity-type');

const INTERACTION_TYPES = _.flatMap( INTERACTION_TYPE );

const ELEMENT_TYPE = Object.assign({}, ENTITY_TYPE, INTERACTION_TYPE);

const ELEMENT_TYPES = _.flatMap( ELEMENT_TYPE );

const isEntity = type => {
  return ENTITY_TYPES.indexOf(type) >= 0;
};

const isInteraction = type => {
  return INTERACTION_TYPES.indexOf(type) >= 0;
};

module.exports = { ELEMENT_TYPE, ELEMENT_TYPES, isEntity, isInteraction };
