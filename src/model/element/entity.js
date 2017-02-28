let Element = require('./element');
let _ = require('lodash');
let { fill } = require('../../util');

const TYPE = 'entity';

const DEFAULTS = Object.freeze({
  type: TYPE
});

/**
A generic biological entity
*/
class Entity extends Element {
  constructor( opts = {} ){
    let data = _.defaultsDeep( {}, opts.data, DEFAULTS );

    opts = _.assign( {}, opts, { data } );

    super( opts );
  }

  static type(){ return TYPE; }

  isEntity(){ return true; }
}

module.exports = Entity;
