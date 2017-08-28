let Element = require('./element');
let _ = require('lodash');
let Promise = require('bluebird');
let ElementSet = require('../element-set');
let { assertFieldsDefined } = require('../../util');
let freeze = obj => Object.freeze( obj );

const TYPE = 'interaction';

const DEFAULTS = Object.freeze({
  type: TYPE,
  entries: [] // used by elementSet
});

const pptType = ( value, displayValue ) => freeze({ value, displayValue });

const PARTICIPANT_TYPE = freeze({
  UNDIRECTED: pptType('undirected', 'General'),
  ACTIVATION: pptType('activation', 'Activation'),
  INHIBITION: pptType('inhibition', 'Inhibition')
});

const PARTICIPANT_TYPES = _.keys( PARTICIPANT_TYPE ).map( k => PARTICIPANT_TYPE[k] );

const getPptTypeByVal = val => {
  return PARTICIPANT_TYPES.find( type => type.value === val ) || PARTICIPANT_TYPE.UNDIRECTED;
};

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

    this.on('remoteregroup', ( el, newGroup, oldGroup ) => {
      let oldType = getPptTypeByVal( oldGroup );
      let newType = getPptTypeByVal( newGroup );

      this.emit( 'retype', el, newType, oldType );
      this.emit( 'remoteretype', el, newType, oldType );
    });
  }

  static get PARTICIPANT_TYPE(){ return PARTICIPANT_TYPE; }

  get PARTICIPANT_TYPE(){ return PARTICIPANT_TYPE; }

  static get PARTICIPANT_TYPES(){ return PARTICIPANT_TYPES; }

  get PARTICIPANT_TYPES(){ return PARTICIPANT_TYPES; }

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

  create( setup = _.noop ){
    return super.create( () => {
      return this.postcreate().then( setup );
    } );
  }

  postcreate(){
    return this.elementSet.create();
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

  getParticipantType( ele ){
    return getPptTypeByVal( this.elementSet.group( ele ) );
  }

  setParticipantType( ele, type ){
    let oldType = this.getParticipantType( ele );
    let typeVal;

    if( type === null || _.isString(type) ){
      typeVal = type;
    } else {
      typeVal = type.value;
    }

    // undirected means no ppt has a type
    if( typeVal === PARTICIPANT_TYPE.UNDIRECTED.value ){
      typeVal = null;
    }

    type = getPptTypeByVal( typeVal );

    if( _.isString( ele ) ){ // in case id passed
      ele = this.get( ele );
    }

    let updatePromise = this.elementSet.regroup( ele, { group: typeVal } );

    this.emit( 'retype', ele, type, oldType );

    return updatePromise;
  }

  retypeParticipant( ele, type ){
    return this.setParticipantType( ele, type );
  }

  participantType( ele, type ){
    if( type === undefined ){
      return this.getParticipantType( ele );
    } else {
      return this.setParticipantType( ele, type );
    }
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
['add', 'remove'].forEach( name => {
  Interaction.prototype[ name ] = function( ...args ){
    return this.elementSet[ name ]( ...args ).then( () => this ); // resolve self
  };
} );

module.exports = Interaction;
