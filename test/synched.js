let { expect } = require('chai');
let Synched = require('../src/model/synched');
let { fill } = require('../src/util');
let EventEmitter = require('eventemitter3');
var is = require('is');
var rdb = require('rethinkdb');
let _ = require('lodash');

let defaults = {
  foo: 'lorem',
  bar: 'ipsum',
  baz: 123
};

class SynchedSubclass extends Synched {
  constructor( opts ){
    super( opts );

    fill({
      obj: this,
      from: opts,
      defs: defaults
    });
  }

  get fields(){
    return super.fields.concat( _.keys(defaults) );
  }
}

describe('Synched', function(){
  let s;

  let clientside = false;

  let serverside = false;

  let conn;

  let copy = s => new SynchedSubclass({
    id: s.id,
    secretId: s.secretId,
    socket: s.socket,
    table: s.table,
    conn: s.conn
  });

  let reload = s => copy(s).load();

  let describeCommonTests = function(){
    describe('create', function(){
      it('can be created', function(){
        return s.create().then(function(){
          expect( s.filled ).to.be.true;
          expect( s.foo ).to.equal('foo');
          expect( s.bar ).to.equal('bar');
          expect( s.baz ).to.equal( 321 );
        });
      });

      it('emits a create event when created', function( done ){
        s.on( 'create', done );

        s.create();
      });
    });

    describe('load', function(){
      it('loads an existing object from the db', function(){
        return s.create().then(function(){
          return reload(s);
        }).then(function( s2 ){
          expect( s2 ).to.have.property('filled', true);
          expect( s2 ).to.have.property('id', s.id);
          expect( s2 ).to.have.property('foo', s.foo);
          expect( s2 ).to.have.property('bar', s.bar);
          expect( s2 ).to.have.property('baz', s.baz);
        });
      });

      it('emits a load event when loaded', function( done ){
        s.create().then(function(){
          let s2 = copy(s);

          s2.on( 'load', done );

          s2.load();
        });
      });
    });

    describe('update', function(){
      beforeEach(function(){
        return s.create();
      });

      it('updates only locally if unfilled', function(){
        let s2 = copy( s );
        let s3 = copy( s );

        s2.update('foo', 'foo-unfilled');

        return s3.load().then(function(){
          expect( s3 ).to.have.property('foo', 'foo');
        });
      });

      it('updates in db if filled', function(){
        return s.update('foo', 'foo2').then(function(){
          return reload( s );
        }).then(function( s2 ){
          expect( s2 ).to.have.property('foo', 'foo2');
        });
      });
    });

    describe('destroy', function(){
      it('remove the object from the db', function(){
        return s.create().then(function(){
          return s.destroy();
        }).then(function(){
          expect( s ).to.have.property('destroyed', true);
        }).then(function(){
          if( serverside ){
            return reload( s ).then( s2 => {
              expect( s2 ).to.be.empty;
            } );
          }
        });
      });

      it('emits a destroy event when destroyed', function( done ){
        s.on( 'destroy', done );

        s.create().then(function(){
          return s.destroy();
        });
      });
    });

    describe('json', function(){
      it('gives the json representation', function(){
        let json = s.json();

        expect( json ).to.have.property('id');
        expect( json ).to.have.property('foo', 'foo');
        expect( json ).to.have.property('bar', 'bar');
        expect( json ).to.have.property('baz', 321);
      });
    });
  };

  describe('clientside', function(){
    beforeEach(function(){
      s = new SynchedSubclass({
        socket: { // mock socket
          emit: function( type, data, onServer ){
            if( type === 'load' ){
              setTimeout( function(){
                let err = null;

                onServer( err, {
                  id: s.id,
                  foo: s.foo,
                  bar: s.bar,
                  baz: s.baz
                } );
              }, 0 );
            } else {
              setTimeout( function(){
                onServer();
              }, 0 );
            }
          }
        },
        secretId: 'secret',
        foo: 'foo',
        bar: 'bar',
        baz: 321
      });

      clientside = true;
      serverside = false;
    });

    describeCommonTests();
  });

  function serverPrePost(){
    before(function( done ){
      rdb.connect({ host: 'localhost', port: 28015 }, function( err, connection ){
        if( err ){ throw err; }

        conn = connection;

        rdb.dbDrop('factoid_test').run( conn, function( err, res ){
          //if( err ){ throw err; }

          rdb.dbCreate('factoid_test').run( conn, function( err, res ){
            if( err ){ throw err; }

            rdb.db('factoid_test').tableCreate('synched').run( conn, function( err, res ){
              if( err ){ throw err; }

              done();
            } );
          } );
        } );
      });

      clientside = true;
      serverside = false;
    });

    afterEach(function( done ){
      rdb.db('factoid_test').table('synched').get( s.id ).delete().run( conn, function( err, res ){
        if( err ){ throw err; }

        done();
      } );
    });

    after(function( done ){
      rdb.dbDrop('factoid_test').run( conn, function( err, res ){
        if( err ){ throw err; }

        conn.close(function( err ){
          if( err ){ throw err; }

          done();
        });
      } );
    });
  }

  describe('serverside', function(){
    serverPrePost();

    beforeEach(function( done ){
      s = new SynchedSubclass({
        table: rdb.db('factoid_test').table('synched'),
        conn: conn,
        secretId: 'secret',
        foo: 'foo',
        bar: 'bar',
        baz: 321
      });

      done();
    });

    describeCommonTests();
  });

  describe('clientside and serverside sync', function(){
    let sc, ss; // synched obj on client/server

    serverPrePost();

    before(function(){
      // set up server side sockets
      require('socket.io')(12345).of('/synched').on('connection', function( socket ){
        let synched = opts => new SynchedSubclass( _.assign( {
          table: rdb.db('factoid_test').table('synched'),
          conn: conn,
        }, opts ) );

        let jsonErr = err => _.pick( err, ['message', 'stack'] );

        socket.on('create', function( data, send ){
          synched( data ).create()
            .then( s => send() )
            .catch( err => send( jsonErr(err) ) )
          ;
        });

        socket.on('load', function( id, send ){
          synched({ id }).load()
            .then( s => send( null, s.json() ) )
            .catch( err => send( jsonErr(err) ) )
          ;
        });

        socket.on('update', function( id, secretId, send ){
          synched({ id, secretId }).update()
            .then( s => send() )
            .catch( err => send( jsonErr(err) ) )
          ;
        });

        socket.on('destroy', function( id, secretId, send ){
          synched({ id, secretId }).destroy()
            .then( s => send() )
            .catch( err => send( jsonErr(err) ) )
          ;
        });
      });
    });

    beforeEach(function( done ){
      sc = new SynchedSubclass({
        socket: require('socket.io-client').connect('http://localhost:12345/synched'),
        id: 'id',
        secretId: 'secret',
        foo: 'foo',
        bar: 'bar',
        baz: 321
      });

      s = ss = new SynchedSubclass({
        table: rdb.db('factoid_test').table('synched'),
        conn: conn,
        id: 'id',
        secretId: 'secret',
        foo: 'foo',
        bar: 'bar',
        baz: 321
      });

      done();
    });

    describe('create-load', function(){
      it('creates on server, loads on client', function(){
        sc.foo = 'not-loaded';
        sc.bar = 'not-loaded';
        sc.baz = 'not-loaded';

        return ss.create().then(function(){
          return sc.load();
        }).then(function(){
          expect( sc ).to.have.property('foo', 'foo');
          expect( sc ).to.have.property('bar', 'bar');
          expect( sc ).to.have.property('baz', 321);
        });
      });

      it('creates on client, loads on server', function(){
        ss.foo = 'not-loaded';
        ss.bar = 'not-loaded';
        ss.baz = 'not-loaded';

        return sc.create().then(function(){
          return ss.load();
        }).then(function(){
          expect( ss ).to.have.property('foo', 'foo');
          expect( ss ).to.have.property('bar', 'bar');
          expect( ss ).to.have.property('baz', 321);
        });
      });
    });

    describe('create-destroy-load', function(){
      it('creates/destroys on server, loads on client', function(){
        sc.foo = 'not-loaded';
        sc.bar = 'not-loaded';
        sc.baz = 'not-loaded';

        return ss.create().then(function(){
          return ss.destroy();
        }).then(function(){
          return sc.load();
        }).then(function(){
          expect('load to resolve').to.equal( false );
        }).catch(function(){
          // we expect the load to fail
        });
      });

      it('creates/destroys on client, loads on server', function(){
        ss.foo = 'not-loaded';
        ss.bar = 'not-loaded';
        ss.baz = 'not-loaded';

        return sc.create().then(function(){
          return sc.destroy();
        }).then(function(){
          return ss.load();
        }).then(function(){
          expect('load to resolve').to.equal( false );
        }).catch(function(){
          // we expect the load to fail
        });
      });
    });

    describe('create-load-update', function(){
      // TODO (requires security acl in model)
    });
  });

});
