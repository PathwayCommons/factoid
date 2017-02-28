let _ = require('lodash');
let Syncher = require('../syncher');
let EventEmitterMixin = require('../event-emitter-mixin');
let ElementSet = require('../element-set');
let ElementCache = require('../element-cache');
var { assertOneOfFieldsDefined, mixin } = require('../../util');

const DEFAULTS = Object.freeze({
  entries: [], // used by elementSet
  name: ''
});

/**
A document that contains a set of biological elements (i.e. entities and interactions).

A document can be thought as a "factoid" --- it contains a unit of biological information,
usually associated with a particular piece of research.
*/
class Document {
  constructor( opts = {} ){
    EventEmitterMixin.call( this ); // defines this.emitter

    let data = _.defaultsDeep( {}, opts.data, DEFAULTS );

    opts = _.assign( {}, opts, { data } );

    assertOneOfFieldsDefined( opts, ['factory', 'cache'] );

    this.syncher = new Syncher( opts );

    this.syncher.forward( this );

    let cache = opts.cache || new ElementCache({
      secret: data.secret,
      factory: opts.factory
    });

    this.elementSet = new ElementSet({
      syncher: this.syncher,
      emitter: this.emitter,
      cache: cache
    });
  }

  filled(){
    return this.syncher.filled;
  }

  id(){
    return this.syncher.get('id');
  }

  cache(){
    return this.elementSet.cache;
  }

  load( setup = _.noop ){
    return this.syncher.load( () => {
      return this.elementSet.load().then( setup );
    } );
  }

  rename( newName ){
    let updatePromise = this.syncher.update( 'name', newName );

    this.emit( 'rename', newName );

    return updatePromise;
  }

  name( newName ){
    if( newName != null ){
      return this.rename( newName );
    } else {
      return this.syncher.get('name');
    }
  }

  entities(){
    return this.elements().filter( el => el.isEntity() );
  }

  interactions(){
    return this.elements().filter( el => el.isInteraction() );
  }
}

mixin( Document.prototype, EventEmitterMixin.prototype );

// forward common calls to the element set
['add', 'remove', 'has', 'get', 'size', 'elements'].forEach( name => {
  Document.prototype[ name ] = function( ...args ){
    return this.elementSet[ name ]( ...args );
  };
} );

// aliases of common syncher functions (just to save typing `.syncher` for common ops)
['create', 'update', 'destroy', 'synch', 'json'].forEach( fn => {
  Document.prototype[ fn ] = function( ...args ){
    return this.syncher[ fn ]( ...args );
  };
} );

module.exports = Document;
