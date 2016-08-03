let { fill } = require('../../util');
let Element = require('./element');
let _ = require('lodash');

let defaults = {
};

class Entity extends Element {
  constructor( opts ){
    super( opts );

    fill({
      obj: this,
      from: opts,
      defs: defaults
    });
  }

  get fields(){ return super.fields.concat( _.keys( defaults ) ); }

  static get type(){ return 'entity'; }

  get isEntity(){ return true; }
}

module.exports = Entity;
