const Entity = require('./entity');
const { ENTITY_TYPE } = require('./entity-type');
const _ = require('lodash');
const ElementSet = require('../element-set');
const { assertFieldsDefined, tryPromise } = require('../../util');

const TYPE = ENTITY_TYPE.COMPLEX;

const DEFAULTS = Object.freeze({
  type: TYPE,
  entries: [] // used by elementSet
});

/**
A compound entity that contains [2,N] simple entities
*/
class Complex extends Entity {
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

  load( setup = _.noop ){
    return super.load( () => {
      return this.postload().then( setup );
    } );
  }

  isComplex(){
    return true;
  }

  postload(){
    return this.elementSet.load();
  }

  create( setup = _.noop ){
    return super.create( () => {
      return this.postcreate().then( setup );
    } );
  }

  postcreate(){
    return this.elementSet.create();
  }

  synch( enable ){
    return tryPromise( () => {
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

  json(){
    return _.assign( {}, super.json(), _.pick( this.syncher.get(), _.keys(DEFAULTS) ) );
  }
}

// forward common calls to the element set
['has', 'get', 'size', 'elements'].forEach( name => {
  Complex.prototype[ name ] = function( ...args ){
    return this.elementSet[ name ]( ...args );
  };
} );

// forward promise-returning calls to the element set
['add', 'remove'].forEach( name => {
  Complex.prototype[ name ] = function( ...args ){
    return this.elementSet[ name ]( ...args ).then( () => this ); // resolve self
  };
} );

module.exports = Complex;
