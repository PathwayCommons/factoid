let Element = require('./element');
let Entity = require('./entity');
let Interaction = require('./interaction');

let types = [ Entity, Interaction ];
let defaultType = Entity;

function ElementFactory( opts ){
  let Type = types.filter( t => t.type === opts.type )[0] || defaultType;

  return new Type( opts );
}

module.exports = ElementFactory;
