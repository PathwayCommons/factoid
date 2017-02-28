let { mixin } = require('../../util');
let _ = require('lodash');
let Syncher = require('../syncher');
let EventEmitterMixin = require('../event-emitter-mixin');

const TYPE = 'element';

const DEFAULTS = Object.freeze({
  position: { x: 0, y: 0 },
  name: '',
  type: TYPE
});

const sanitizePosition = pos => _.pick( pos, _.keys( DEFAULTS.position ) );

/**
A generic biological element of no specific type

For all objects of (sub)class `Element`, it is important to specify a `Syncher`.
This allows for reading and writing on the DB and keeping the object synched
with remote updates.
*/
class Element {
  constructor( opts = {} ){
    EventEmitterMixin.call( this ); // defines this.emitter

    let data = _.defaultsDeep( {}, opts.data, DEFAULTS );

    sanitizePosition( data.position );

    let synchedOpts = _.assign( {}, opts, { data } );

    this.syncher = new Syncher( synchedOpts );

    this.syncher.forward( this );

    this.on('remoteupdate', ( changes, old ) => {
      if( changes.position != null ){
        this.emit( 'reposition', changes.position, old.position );
      }

      if( changes.name != null ){
        this.emit( 'rename', changes.name, old.name );
      }
    });
  }

  filled(){
    return this.syncher.filled;
  }

  static type(){ return TYPE; }

  type(){
    return this.syncher.get('type');
  }

  isEntity(){
    return false;
  }

  isInteraction(){
    return false;
  }

  id(){
    return this.syncher.get('id');
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

  reposition( newPos = {} ){
    let synched = this.syncher;

    newPos = sanitizePosition( newPos );

    newPos = _.assign( {}, synched.get('position'), newPos );

    let updatePromise = synched.update( 'position', newPos );

    this.emit( 'reposition', newPos );

    return updatePromise;
  }

  position( newPos ){
    if( newPos != null ){
      return this.reposition( newPos );
    } else {
      return this.syncher.get('position');
    }
  }
}

mixin( Element.prototype, EventEmitterMixin.prototype );

// aliases of common syncher functions (just to save typing `.syncher` for common ops)
['create', 'load', 'update', 'destroy', 'synch', 'json'].forEach( fn => {
  Element.prototype[ fn ] = function( ...args ){
    return this.syncher[ fn ]( ...args );
  };
} );

module.exports = Element;
