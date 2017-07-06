let Element = require('./element');
let _ = require('lodash');
let Promise = require('bluebird');
let ElementSet = require('../element-set');
var { assertFieldsDefined } = require('../../util');

const TYPE = 'interaction';

const DEFAULTS = Object.freeze({
  type: TYPE,
  entries: [] // used by elementSet
});

/**
A generic biological interaction between [0, N] elements

It is important to specify a `cache` on an interaction.  This indicates the cache
from which the elements are loaded/taken.  For example, an interaction commonly
has a cache whose source is a `Document`.  This makes it so that when an
interaction is loaded, along with its participants, the participants aren't
doubly loaded.  The document and the interaction guarantee that they share the
same reference for associated elements, by virtue of the cache.
*/
class Interaction extends Element {
  constructor( opts = {} ){
    let data = _.defaultsDeep( {}, opts.data, DEFAULTS );

    opts = _.assign( {}, opts, { data } );

    super( opts );

    assertFieldsDefined( opts, ['cache'] );

    this.elementSet = new ElementSet({
      syncher: this.syncher,
      emitter: this.emitter,
      cache: opts.cache
    });
  }

  static type(){ return TYPE; }

  isInteraction(){ return true; }

  load( setup = _.noop ){
    return super.load( () => {
      return this.postload().then( setup );
    } );
  }

  postload(){
    return this.elementSet.load();
  }

  synch( enable ){
    return Promise.try( () => {
      return super.synch( enable );
    } ).then( () => {
      return this.elementSet.synch( enable );
    } );
  }

  participants(){
    return this.elements();
  }

  addParticipant( ele, opts ){
    return this.add( ele, opts );
  }

  removeParticipant( ele, opts ){
    return this.remove( ele, opts );
  }

  regroupParticipant( ele, opts ){
    return this.regroup( ele, opts );
  }

  json(){
    return _.assign( {}, super.json(), {
      elements: this.elements().map( el => el.json() )
    } );
  }
}

// forward common calls to the element set
['has', 'get', 'size', 'elements'].forEach( name => {
  Interaction.prototype[ name ] = function( ...args ){
    return this.elementSet[ name ]( ...args );
  };
} );

// forward promise-returning calls to the element set
['add', 'remove', 'regroup'].forEach( name => {
  Interaction.prototype[ name ] = function( ...args ){
    return this.elementSet[ name ]( ...args ).then( () => this ); // resolve self
  };
} );

module.exports = Interaction;
