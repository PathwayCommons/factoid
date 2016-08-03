let { fill, passthrough } = require('../util');
let Promise = require('bluebird');
let EventEmitter = require('eventemitter3');
let _ = require('lodash');
let is = require('is');
let uuid = require('uuid');
let promisifiedEmit = function( emitter ){
  return (function(){
    let args = _.slice( arguments );

    return new Promise( ( resolve, reject ) => {
      args.push( ( err, val ) => {
        if( err ){
          reject( err );
        } else {
          resolve( val );
        }
      } );

      emitter.emit.apply( emitter, args );
    } );
  });
};

// A CRUD object that is synched between the clientside and serverside via Socket.io and RethinkDB
//   - All functions return a promise, fulfilled when the op is synched
//   - Clientside updates are reflected (values, events) synchronously
//     - Prevents update lag on the local client
//     - Errors can still be handled using the returned promises
//   - Subclasses must define `get fields()` to know which fields to sync
class Synched {
  constructor( opts ){
    if( !opts.socket && ( !opts.table || !opts.conn ) ){
      throw new Error('An instance of Synched must have a `socket` (clientside) or a `table` with a connection `conn` (serverside)');
    }

    fill({
      obj: this,
      from: opts,
      defs: {
        id: uuid.v4(),
        secretId: 'read-only'
      },
      only: this.fields.concat(['socket', 'table', 'conn'])
    });

    // mixins
    EventEmitter.call( this );
  }

  get fields(){ return ['id', 'secretId']; }

  create( setup = _.noop ){
    let col = this.collection;
    let data = _.pick( this, this.fields );
    let insert;
    let fill = () => this.filled = true;
    let emitSelf = () => this.emit('create');

    if( this.table ){
      insert = () => this.table.insert( data ).run( this.conn ).then( fill ).then( emitSelf );
    } else {
      insert = () => {
        let emitServer = promisifiedEmit( this.socket );

        // create synchronously and optimistically on the clientside
        fill();
        emitSelf();

        return emitServer( 'create', data );
      };
    }

    return insert().then( setup ).then(() => {
      return this;
    } );
  }

  load( setup = _.noop ){
    let col = this.collection;
    let assign = obj => _.assign( this, obj );
    let find;

    if( this.table ){
      find = () => this.table.get( this.id ).run( this.conn ).then( json => {
        if( json == null ){
          throw new Error(`No response from database for ID ${this.id}`);
        } else {
          return json;
        }
      } );
    } else {
      find = () => {
        let emitServer = promisifiedEmit( this.socket );

        return emitServer( 'load', this.id );
      };
    }

    return find().then( assign ).then( setup ).then( () => {
      this.filled = true;

      this.emit('load');

      return this;
    } );
  }

  // update('foo', 'bar') => update 1 val
  // update({ foo: 'bar', baz: 'bat' }) => update multiple vals
  // update('foo') => update db with val in element (useful deep objs like arrays)
  update( field, value ){
    let col = this.collection;
    let obj;

    if( is.object( field ) ){
      obj = field;
    } else if( value !== undefined ){
      obj = _.set( {}, field, value );
    } else {
      obj = _.set( {}, field, this[ field ] );
    }

    let notId = f => f !== 'id';
    let fields = _.omit( this.fields, ['id', 'secretId'] ); // unsettable fields

    obj = _.pick( obj, fields ); // sanitise fields

    _.assign( this, obj );

    let emitSelf = () => this.emit( 'update', obj );
    let update;

    if( this.table ){
      update = () => this.table.get( this.id ).update( obj ).run( this.conn ).then( emitSelf );
    } else if( !this.filled ){ // only a local (not yet synched) instance
      update = () => Promise.resolve().then( emitSelf );
    } else {
      update = () => {
        let emitServer = promisifiedEmit( this.socket );

        emitSelf(); // update synchronously and optimistically on the clientside

        return emitServer( 'update', this.id, this.secretId, obj );
      };
    }

    return update().then(() => {
      return this;
    });
  }

  destroy( teardown = _.noop ){
    let emitSelf = () => this.emit('destroy');
    let markDestroyed = () => this.destroyed = true;
    let remove;

    if( this.table ){
      remove = () => this.table.get( this.id ).delete().run( this.conn ).then( markDestroyed ).then( emitSelf );
    } else if( !this.filled ){ // i.e. local instance, yet unsynched
      remove = () => Promise.resolve().then( markDestroyed ).then( emitSelf );
    } else {
      remove = () => {
        let emitServer = promisifiedEmit( this.socket );

        // destroy synchronously and optimistically on the clientside
        markDestroyed();
        emitSelf();

        return emitServer( 'destroy', this.id, this.secretId );
      };
    }

    return remove().then( teardown ).then( () => {
      return this;
    } );
  }

  json(){
    return _.pick( this, this.fields );
  }
}

// mixins
_.extend( Synched.prototype, EventEmitter.prototype );

module.exports = Synched;
