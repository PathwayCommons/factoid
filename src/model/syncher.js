let { fill, error, promisifyEmit, mixin, ensureArray, assert } = require('../util');
let Promise = require('bluebird');
let EventEmitterMixin = require('./event-emitter-mixin');
let _ = require('lodash');
let uuid = require('uuid');
let EventEmitter = require('eventemitter3');

const OP_TYPE = Object.freeze({
  CREATE: 'CREATE',
  ASSIGN: 'ASSIGN',
  MERGE: 'MERGE',
  PUSH: 'PUSH',
  PULL: 'PULL',
  PULL_BY_ID: 'PULL_BY_ID',
  MERGE_BY_ID: 'MERGE_BY_ID'
});

const DEFAULT_UPDATE_OPTIONS = Object.freeze({
  type: OP_TYPE.ASSIGN
});

const RDB_TYPE = Object.freeze({
  ARRAY: 'ARRAY',
  OBJECT: 'OBJECT'
});

// check status of db r/w op
let checkStatus = status => {
  if( status.errors > 0 ){
    throw error( status.first_error );
  }
};

/**
A CRUD JSON object that is synched between the clientside and serverside via Socket.io and RethinkDB
  - All functions return a promise, fulfilled when the op is synched
  - Clientside updates are reflected (values, events) synchronously
    - Prevents update lag on the local client
    - Errors can still be handled using the returned promises
*/
class Syncher {

  // fields that aren't synched
  unsynchedFields(){ return ['socket', 'table', 'conn', 'emitter', 'forwardedEmitters', 'isPrivate']; }

  // fields that should not be sent to the clientside
  privateFields(){ return ['secret', '_ops']; }

  // fields that can't be mutated in the db (i.e. .update() ops)
  constRemoteFields(){ return ['id', 'secret']; }

  // fields that can't be mutated locally (i.e. .load(), live synched .update() ops)
  constLocalFields(){ return ['id', 'secret', 'liveId', '_ops', '_newestOp']; }

  constructor( opts = {} ){
    assert( opts.socket || ( opts.rethink && opts.table && opts.conn ), `An instance of Syncher must have a 'socket' (client) or a 'rethink' with a 'table' and a connection 'conn' (server)` );

    // mixins
    EventEmitterMixin.call( this ); // defines this.emitter

    fill({
      obj: this,
      from: opts,
      only: [
        'rethink',
        'table',
        'socket',
        'conn',
        'isPrivate' // for private:true server instances, secret checks are bypassed (i.e. the server is considered priviledged)
      ]
    });

    this.data = _.defaults( {}, opts.data, {
      id: uuid(),
      liveId: uuid(), // to determine the origin of live updates
      secret: 'read-only' // secret must match the secret stored in the db to make writes
    } );

    this.localOps = [];

    // handle live sync updates from the serverside
    if( this.socket ){
      let canUpdate = obj => this.live && this.filled && this.data.liveId !== obj.liveId && this.data.id === obj.id;
      let canRemoveLocalOp = obj => this.live && this.filled && this.data.liveId === obj.liveId && this.data.id === obj.id;
      let canUpdateOnCreate = canRemoveLocalOp;

      this.socket
        .on('create', ( obj ) => {
          if( !canUpdateOnCreate( obj ) ){ return; }

          let sanitizedCopyOfChanges = _.cloneDeep( _.omit( obj, this.constLocalFields() ) );

          _.assign( this.data, sanitizedCopyOfChanges );
        })

        .on('update', ( diff ) => {
          if( canRemoveLocalOp( diff.new ) ){
            this.removeLocalOp( diff.new._newestOp.id );
          }

          if( !canUpdate( diff.new ) ){ return; }

          // use the new values but re-apply local updates so they aren't lost
          let sanitizedCopyOfChanges = _.cloneDeep( _.omit( diff.changes, this.constLocalFields() ) );
          _.assign( this.data, sanitizedCopyOfChanges );
          this.applyLocalOps();

          this.emit('remoteupdate', diff.changes, diff.old);
          this.emit('update', diff.changes, diff.old);
        })

        .on('destroy', ( obj ) => {
          if( !canUpdate( obj ) ){ return; }

          this.destroyed = true;

          this.emit('remotedestroy');
          this.emit('destroy');
        })

        .on('error', ( err ) => {
          Syncher.errorEmitter.emit( 'socket', err );
        })
      ;
    }
  }

  static get errorEmitter(){
    Syncher._errorEmitter = Syncher._errorEmitter || new EventEmitter();

    return Syncher._errorEmitter;
  }

  static synch( opts ){
    let { io, rethink, table, conn } = opts;
    let syncher = data => new Syncher({ rethink, table, conn, data });
    let jsonErr = err => _.pick( err, ['message', 'stack'] );
    let emptySyncher = syncher();

    // set up server side sockets
    io.on('connection', ( socket ) => {
      socket
        .on('create', ( data, send ) => {
          syncher( data ).create()
            .then( () => send() )
            .catch( err => send( jsonErr(err) ) )
          ;
        })
        .on('load', ( id, send ) => {
          syncher({ id }).load()
            .then( s => {
              return send( null, s.json() );
            } )
            .catch( err => send( jsonErr(err) ) )
          ;
        })
        .on('update', ( id, secret, liveId, opId, type, obj, send ) => {
          syncher({ id, secret, liveId }).update( obj, { type, id: opId } )
            .then( () => send() )
            .catch( err => send( jsonErr(err) ) )
          ;
        })
        .on('destroy', ( id, secret, liveId, send ) => {
          syncher({ id, secret, liveId }).destroy()
            .then( () => send() )
            .catch( err => send( jsonErr(err) ) )
          ;
        })
        .on('synch', ( id, send ) => {
          socket.join( id );
          send();
        })
        .on('unsynch', ( id, send ) => {
          socket.leave( id );
          send();
        })
        .on('error', ( err ) => {
          Syncher.errorEmitter.emit( 'socket', err );
        })
      ;
    });

    let filteredTable = opts.filter ? table.filter( opts.filter ) : table;

    filteredTable.changes({
      includeTypes: true,
      squash: false
    }).run( conn, ( err, cursor ) => {
      cursor.each(( err, diff ) => {
        if( err || !diff ){ return; }

        let allFields = _.uniq( _.concat( _.keys( diff.old_val ), _.keys( diff.new_val ) ) );

        let pubFields = _.difference( allFields, emptySyncher.privateFields() );

        let sanitize = obj => _.pick( obj, pubFields );
        let type = diff.type;

        let sdiff = {
          old: sanitize( diff.old_val ),
          new: sanitize( diff.new_val ),
          changes: {}
        };

        pubFields.forEach( key => {
          if( !_.isEqual( sdiff.old[key], sdiff.new[key] ) ){
            sdiff.changes[key] = sdiff.new[key];
          }
        } );

        let id = (diff.new_val || diff.old_val).id;

        if( type === 'add' ){
          io.to( id ).emit( 'create', sdiff.new );
        } else if( type === 'remove' ){
          io.to( id ).emit( 'destroy', sdiff.old );
        } else if( type === 'change' ){
          if( diff.new_val.destroyed ){
            // then ignore the event, it's just for marking who's about to destroy
          } else {
            io.to( id ).emit( 'update', sdiff );
          }
        }
      });
    } );
  }

  synch( enable = true ){
    if( this.socket ){
      let emitServer = promisifyEmit( this.socket );
      let live = this.live;

      this.live = enable;

      if( enable ){
        if( !live ){
          return emitServer( 'synch', this.data.id ).catch( () => this.live = false );
        } else {
          return Promise.resolve();
        }
      } else if( !enable ){
        if( live ){
          return emitServer( 'unsynch', this.data.id ).catch( this.live = true );
        } else {
          return Promise.resolve();
        }
      }
    } else {
      return Promise.reject( error('A Syncher object can not be synch()ed without a socket to a server') );
    }
  }

  synched(){
    return this.live;
  }

  create( setup = _.noop ){
    let data = _.omit( this.data, this.unsynchedFields() );
    let insert;
    let fill = () => this.filled = true;
    let emitSelf = () => this.emit('create');

    if( this.table ){
      insert = () => {
        let op = this.timestampOp( this.getOp( data, { type: OP_TYPE.CREATE } ) );
        let insertion = _.assign( {}, data, {
          _ops: [ op ],
          _creationTimestamp: op.timestamp
        } );

        return this.table.insert( insertion ).run( this.conn ).then( checkStatus ).then( fill ).then( emitSelf );
      };
    } else {
      insert = () => {
        let emitServer = promisifyEmit( this.socket );

        // create synchronously and optimistically on the clientside
        fill();
        emitSelf();

        return emitServer( 'create', data );
      };
    }

    return Promise.try( insert ).then( setup ).then( () => this );
  }

  load( setup = _.noop ){
    let assign = obj => _.assign( this.data, _.omit( obj, this.constLocalFields() ) );
    let find;

    if( this.table ){
      find = () => this.table.get( this.data.id ).run( this.conn ).then( json => {
        if( json == null ){
          throw error(`No response from database for ID ${this.data.id}`);
        } else {
          return _.omit( json, this.privateFields() );
        }
      } );
    } else {
      find = () => {
        let emitServer = promisifyEmit( this.socket );

        return emitServer( 'load', this.data.id );
      };
    }

    return Promise.try( find ).then( assign ).then( setup ).then( () => {
      this.filled = true;

      this.emit('load');

      return this;
    } );
  }

  confirmSecret(){
    if( !this.table ){
      return Promise.reject( error('Secret confirmation can be done only with database access (on the serverside)') );
    }

    if( this.isPrivate ){
      return Promise.resolve();
    }

    return Promise.try( () => {
      return this.table.get( this.data.id ).run( this.conn );
    } ).then( entry => {
      if( entry.secret !== this.data.secret ){
        throw error(`Secret confirmation failed for ID ${this.data.id} because secret ${this.data.secret} is incorrect`);
      }
    } );
  }

  get( field ){
    if( field != null ){
      return this.data[ field ];
    } else {
      return this.data;
    }
  }

  getOp( field, value, options ){
    let data;

    if( _.isObject( field ) ){ // update({ foo: 'bar' }, [options])
      data = field;
      options = value;
      value = null;
    } else if( _.isString( field ) ){
      if( value !== undefined ){ // update('foo', 'bar', [options])
        data = _.set( {}, field, value );
      } else { // update('foo')
        data = _.set( {}, field, this.data[ field ] );
      }
    } else {
      throw error(`Syncher update() needs a field string or an object, got ${field}`);
    }

    options = _.defaults( {}, options, DEFAULT_UPDATE_OPTIONS );

    let id;
    let omissions = []; // fields to omit from options

    if( options.id ){
      id = options.id;

      omissions.push('id');
    } else {
      id = uuid();
    }

    if( options.silent == null ){
      omissions.push('silent');
    }

    if( omissions.length > 0 ){
      options = _.omit( options, omissions );
    }

    let liveId = this.data.liveId;

    return { data, options, id, liveId };
  }

  addLocalOp( op ){
    this.localOps.push( op );
  }

  removeLocalOp( id ){
    _.remove( this.localOps, op => op.id === id );
  }

  applyLocalOps(){
    let applyOp = op => {
      let { data, options } = op;

      options = _.assign( {}, options, { silent: true } );

      return this.update( data, options );
    };

    this.localOps.forEach( applyOp );
  }

  creationTimestamp(){
    return this.data._creationTimestamp;
  }

  timestampOp( op ){
    let r = this.rethink;

    return _.extend( {}, op, {
      timestamp: r.now()
    } );
  }

  updateSelfWithOp( op, sanitizedData ){
    let options = op.options;
    let obj = sanitizedData;

    switch( options.type ){
      case OP_TYPE.PUSH:
        _.keys( obj ).forEach( k => {
          let vals = obj[k] = ensureArray( obj[k] );
          let arr = this.data[k] = ensureArray( this.data[k] );

          arr.push( ...vals );
        } );
        break;
      case OP_TYPE.PULL:
        _.keys( obj ).forEach( k => {
          let vals = obj[k] = ensureArray( obj[k] );
          let arr = this.data[k] = ensureArray( this.data[k] );

          _.pull( arr, ...vals );
        } );
        break;
      case OP_TYPE.PULL_BY_ID:
        _.keys( obj ).forEach( k => {
          let ids = obj[k] = ensureArray( obj[k] );
          let arr = this.data[k] = ensureArray( this.data[k] );
          let idSet = new Set( ids );

          _.remove( arr, o => idSet.has( o.id ) );
        } );
        break;
      case OP_TYPE.MERGE_BY_ID:
        _.keys( obj ).forEach( k => {
          let entries = ensureArray( obj[k] );
          let els = this.data[k] = ensureArray( this.data[k] );
          let elsById = new Map( els.map( el => [ el.id, el ] ) );

          _.forEach( entries, entry => {
            let el = elsById.get( entry.id );

            _.merge( el, entry );
          } );
        } );
        break;
      case OP_TYPE.MERGE:
        _.merge( this.data, obj );
        break;
      case OP_TYPE.ASSIGN:
      default:
        _.assign( this.data, obj );
        break;
    }
  }

  updateDatabaseWithOp( op, sanitizedData ){
    let r = this.rethink;
    let options = op.options;
    let obj = sanitizedData;

    let change = ( () => {
      switch( options.type ){
        case OP_TYPE.PUSH:
          return _.mapValues( obj, ( vals, key ) => {
            return r.branch(
              r.row( key ).default( null ).typeOf().eq( RDB_TYPE.ARRAY ), // if
              vals.reduce( ( arr, val ) => arr.append( val ), r.row( key ) ), // then
              vals // else => just put the vals if empty/null/not-an-array
            );
          } );
        case OP_TYPE.PULL:
          return _.mapValues( obj, ( vals, key ) => {
            return r.branch(
              r.row( key ).default( null ).typeOf().eq( RDB_TYPE.ARRAY ), // if
              r.row( key ).difference( vals ), // then
              [] // else => if no array in db, set empty
            );
          } );
        case OP_TYPE.PULL_BY_ID:
          return _.mapValues( obj, ( vals, key ) => {
            return r.branch(
              r.row( key ).default( null ).typeOf().eq( RDB_TYPE.ARRAY ), // if
              r.row( key ).filter(function( o ){
                return r.and( ...( vals.map( val => o('id').ne( val ) ) ) );
              }),
              [] // else => if no array in db, set empty
            );
          } );
        case OP_TYPE.MERGE_BY_ID:
          return _.mapValues( obj, ( entry, key ) => {
            return r.branch(
              r.row( key ).default( null ).typeOf().eq( RDB_TYPE.ARRAY ), // if
              r.row( key ).outerJoin( [ entry ], function( row, entry ){ // then
                return row('id').eq( entry('id') );
              } ).zip(),
              [] // else => if no array in db, set empty
            );
          } );
        case OP_TYPE.MERGE:
          return _.mapValues( obj, ( val, key ) => {
            if( _.isObject(val) ){
              return r.branch(
                r.row( key ).default( null ).typeOf().eq( RDB_TYPE.OBJECT ), // if
                r.row( key ).merge( val ), // then
                val // else; b/c you can't rdb .merge() a primitive
              );
            } else { // b/c you can't rdb .merge() a primitive (better perf anyway)
              return val;
            }
          } );
        default:
        case OP_TYPE.ASSIGN:
          return obj;
      }
    } )();

    let opToWrite = this.timestampOp( op );

    change = _.assign( {}, change, {
      liveId: this.data.liveId, // db writes should always include who made them (i.e. last writer)

      _ops: r.branch(
        r.row('_ops').default( null ).typeOf().eq( RDB_TYPE.ARRAY ), // if
        r.row('_ops').append( opToWrite ), // then
        [ opToWrite ] // else => just put the op if empty/null/not-an-array
      ),

      _newestOp: opToWrite
    } );

    return this.table.get( this.data.id ).update( change ).run( this.conn );
  }

  // update('foo', 'bar') => update 1 val
  // update({ foo: 'bar', baz: 'bat' }) => update multiple vals
  // update('foo') => update db with val in element (useful deep objs like arrays)
  update( field, value, options ){
    let op = this.getOp( field, value, options );

    let obj = op.data;

    options = op.options;

    obj = _.omit( obj, this.constRemoteFields() );

    let objKeys = _.keys(obj);
    let old = _.pick( this.data, objKeys );

    this.updateSelfWithOp( op, obj );

    if( options.silent ){
      return Promise.resolve( this );
    }

    let changes = _.pick( this.data, objKeys );
    let emitSelf = () => {
      this.emit( 'localupdate', changes, old );
      this.emit( 'update', changes, old );
    };
    let update;

    if( this.table ){
      let write = () => this.updateDatabaseWithOp( op, obj );

      update = () => this.confirmSecret().then( write ).then( checkStatus ).then( emitSelf );
    } else if( !this.filled ){ // only a local (not yet synched) instance
      update = () => Promise.resolve().then( emitSelf );
    } else {
      update = () => {
        let emitServer = promisifyEmit( this.socket );

        this.addLocalOp( op );

        emitSelf(); // update synchronously and optimistically on the clientside

        return Promise
          .try( () => emitServer( 'update', this.data.id, this.data.secret, this.data.liveId, op.id, options.type, obj ) )
          .then( () => this.removeLocalOp( op.id ) )
        ;
      };
    }

    return Promise.try( update ).then( () => this );
  }

  updateByType( type, field, value, options ){
    let op = this.getOp( field, value, options );

    return this.update( op.data, _.assign( op.options, { type } ) );
  }

  // merge('foo', { bar: { baz: 'bat' } }) => merge foo instead of replacing
  merge( field, value, options ){
    return this.updateByType( OP_TYPE.MERGE, field, value, options );
  }

  // push('foo', 1) => push one value to one array
  // push('foo', [1, 2]) => push to one array
  // push({ foo: [1, 2], bar: [3] }) => push to multiple arrays at once
  push( field, values, options ){
    return this.updateByType( OP_TYPE.PUSH, field, values, options );
  }

  // pull('foo', 1) => pull one value from one array
  // pull('foo', [1, 2]) => pull from one array
  // pull({ foo: [1, 2], bar: [3] }) => pull to multiple arrays at once
  pull( field, values, options ){
    return this.updateByType( OP_TYPE.PULL, field, values, options );
  }

  // pullById('foo', 1) => pull from foo array obj with id === 1
  // pullById('foo', [1, 2]) => pull from foo array obj with id === 1 || id === 2
  // pullById({ foo: [1, 2], bar: 3 }) => pull from foo array obj with id 1 or 2, pull from bar array obj with id 3
  pullById( field, ids, options ){
    return this.updateByType( OP_TYPE.PULL_BY_ID, field, ids, options );
  }

  // mergeById('foo', { id, data }) => in array foo, merge data for object with id
  // mergeById({ foo: { id, data } }) => same as above
  // mergeById({ foo: [{ id, data }, { id, data }], bar: { id, data } }) => merge for multiple fields
  mergeById( field, entry, options ){
    return this.updateByType( OP_TYPE.MERGE_BY_ID, field, entry, options );
  }

  destroy( teardown = _.noop ){
    let emitSelf = () => this.emit('destroy');
    let markDestroyed = () => this.destroyed = true;
    let remove;

    if( this.table ){
      let markDb = () => this.table.get( this.data.id ).update({ destroyed: true, liveId: this.data.liveId }).run( this.conn );
      let del = () => this.table.get( this.data.id ).delete().run( this.conn );

      remove = () => this.confirmSecret().then( markDb ).then( checkStatus ).then( del ).then( checkStatus ).then( markDestroyed ).then( emitSelf );
    } else if( !this.filled ){ // i.e. local instance, yet unsynched
      remove = () => Promise.resolve().then( markDestroyed ).then( emitSelf );
    } else {
      let unsynch = () => this.synch( false );

      let del = () => {
        let emitServer = promisifyEmit( this.socket );

        // destroy synchronously and optimistically on the clientside
        markDestroyed();
        emitSelf();

        return emitServer( 'destroy', this.data.id, this.data.secret, this.data.liveId );
      };

      remove = () => unsynch().then( del );
    }

    return Promise.try( remove ).then( teardown ).then( () => this );
  }

  json(){
    return _.omit( this.data, this.privateFields() );
  }
}

mixin( Syncher.prototype, EventEmitterMixin.prototype );

module.exports = Syncher;
