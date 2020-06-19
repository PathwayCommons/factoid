import { mixin } from '../../util';
import _ from 'lodash';
import Syncher from '../syncher';
import EventEmitterMixin from '../event-emitter-mixin';

const TYPE = 'element';

const DEFAULTS = Object.freeze({
  position: { x: 0, y: 0 },
  name: '',
  description: '',
  type: TYPE,
  completed: false
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
        this.emit( 'remotereposition', changes.position, old.position );
      }

      if( changes.name != null ){
        this.emit( 'rename', changes.name, old.name );
        this.emit( 'remoterename', changes.name, old.name );
      }

      if( changes.description != null ){
        this.emit( 'redescribe', changes.description, old.description );
        this.emit( 'remoteredescribe', changes.description, old.description );
      }

      if( changes.completed != null ){
        this.emit( 'complete', changes.completed, old.completed );
        this.emit( 'remotecomplete', changes.completed, old.completed );
      }
    });
  }

  filled(){
    return this.syncher.filled;
  }

  live(){
    return this.syncher.live;
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

  isComplex(){
    return false;
  }

  id(){
    return this.syncher.get('id');
  }

  secret(){
    return this.syncher.get('secret');
  }

  postload(){
    return Promise.resolve();
  }

  postcreate(){
    return Promise.resolve();
  }

  rename( newName ){
    let updatePromise = this.syncher.update( 'name', newName );

    this.emit( 'rename', newName );
    this.emit( 'localrename', newName );

    return updatePromise;
  }

  name( newName ){
    if( newName !== undefined ){
      return this.rename( newName );
    } else {
      return this.syncher.get('name');
    }
  }

  named(){
    let name = this.syncher.get('name');

    return name != null && name != '';
  }

  reposition( newPos = {} ){
    let synched = this.syncher;

    newPos = sanitizePosition( newPos );

    newPos = _.assign( {}, synched.get('position'), newPos );

    let updatePromise = synched.update( 'position', newPos );

    this.emit( 'reposition', newPos );
    this.emit( 'localreposition', newPos );

    return updatePromise;
  }

  position( newPos ){
    if( newPos !== undefined ){
      return this.reposition( newPos );
    } else {
      return this.syncher.get('position');
    }
  }

  redescribe( descr ){
    let updatePromise = this.syncher.update( 'description', descr );

    this.emit( 'redescribe', descr );
    this.emit( 'localredescribe', descr );

    return updatePromise;
  }

  description( descr ){
    if( descr !== undefined ){
      return this.redescribe( descr );
    } else {
      return this.syncher.get('description');
    }
  }

  complete(){
    let completed = this.completed();

    if( !completed ){
      let update = this.syncher.update({ completed: true });

      this.emit('complete');
      this.emit('localcomplete');

      return update;
    } else {
      return Promise.resolve();
    }
  }

  uncomplete(){
    let completed = this.completed();

    if( completed ){
      let update = this.syncher.update({ completed: false });

      this.emit('uncomplete');
      this.emit('localuncomplete');

      return update;
    } else {
      return Promise.resolve();
    }
  }

  relatedPapers( papersData ){
    if( papersData ){
      let p = this.syncher.update({ 'relatedPapers': papersData });
      this.emit( 'relatedPapers', papersData );
      return p;
    }
    else if( !papersData ){
      return this.syncher.get( 'relatedPapers' );
    }
  }

  completed(){
    return this.syncher.get('completed');
  }

  json(){
    return _.assign({}, _.pick( this.syncher.get(), ['id', 'secret'].concat( _.keys(DEFAULTS) ) ) );
  }
}

mixin( Element.prototype, EventEmitterMixin.prototype );

// aliases of common syncher functions (just to save typing `.syncher` for common ops)
['creationTimestamp'].forEach( fn => {
  Element.prototype[ fn ] = function( ...args ){
    return this.syncher[ fn ]( ...args );
  };
} );

// promise aliases
['create', 'load', 'update', 'destroy', 'synch'].forEach( fn => {
  Element.prototype[ fn ] = function( ...args ){
    return this.syncher[ fn ]( ...args ).then( () => this );
  };
} );

export default Element;
