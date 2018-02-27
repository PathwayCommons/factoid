let conf = require('./util/conf');

let { expect, assert } = require('chai');
let Syncher = require('../src/model/syncher');
let _ = require('lodash');
let Promise = require('bluebird');
let MockSocket = require('./mock/socket');
let TableUtil = require('./util/table');
let io = require('./util/socket-io');
let { when, whenAll, delay } = require('./util/when');

let NS = 'syncher_tests';

describe('Syncher', function(){
  let s;

  let clientside = false;

  let serverside = false;

  let tableUtil;

  this.timeout( conf.defaultTimeout );

  let whenAllRemoteupdates = ( synchers, n ) => whenAll( synchers, 'remoteupdate', n );

  let copy = sy => {
    let opts = _.pick( sy, ['rethink', 'socket', 'table', 'conn'] );

    opts.data = _.pick( sy.get(), ['id', 'secret'] );

    return new Syncher( opts );
  };

  let reload = sy => copy(sy).load();

  let describeCommonTests = function(){
    describe('(create)', function(){
      it('can be created', function(){
        return s.create().then(function(){
          let d = s.get();

          expect( s.filled ).to.be.true;
          expect( d.foo ).to.equal('foo');
          expect( d.bar ).to.equal('bar');
          expect( d.baz ).to.equal( 321 );
        });
      });

      it('emits a create event when created', function( done ){
        s.on( 'create', done );

        s.create();
      });
    });

    describe('(emitter)', function(){
      it('has an emitter', function(){
        expect( s ).to.have.property('emitter');
      });
    });

    describe('(load)', function(){
      it('loads an existing object from the db', function(){
        return s.create().then(function(){
          return reload(s);
        }).then(function( s2 ){
          expect( s2 ).to.have.property('filled', true);
          expect( s2.get() ).to.have.property('id', s.get().id);
          expect( s2.get() ).to.have.property('foo', s.get().foo);
          expect( s2.get() ).to.have.property('bar', s.get().bar);
          expect( s2.get() ).to.have.property('baz', s.get().baz);
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

    describe('(update)', function(){
      beforeEach(function(){
        return s.create();
      });

      if( clientside ){
        it('updates only locally if unfilled', function(){
          let s2 = copy( s );
          let s3 = copy( s );

          s2.update('foo', 'foo-unfilled');

          return s3.load().then(function(){
            expect( s3.get() ).to.have.property('foo', 'foo');
          });
        });
      }

      it('puts changes in emitted event', function( done ){
        s.on('update', function( changes ){
          expect( changes ).to.have.property('foo', 'foo2');

          done();
        });

        s.update({ foo: 'foo2' });
      });

      it('updates in db if filled', function(){
        return s.update('foo', 'foo2').then(function(){
          return reload( s );
        }).then(function( s2 ){
          expect( s2.get() ).to.have.property('foo', 'foo2');
        });
      });
    });

    describe('(merge)', function(){
      beforeEach(function(){
        return s.create();
      });

      if( clientside ){
        it('merges only locally if unfilled', function(){
          let s2 = copy( s );
          let s3 = copy( s );

          s2.merge('foo', 'foo-unfilled');

          return s3.load().then(function(){
            expect( s3.get() ).to.have.property('foo', 'foo');
          });
        });
      }

      it('puts changes in emitted event', function( done ){
        s.on('update', function( changes ){
          expect( changes ).to.have.property('foo', 'foo2');

          done();
        });

        s.merge({ foo: 'foo2' });
      });

      it('updates in db if filled', function(){
        return s.merge('foo', 'foo2').then(function(){
          return reload( s );
        }).then(function( s2 ){
          expect( s2.get() ).to.have.property('foo', 'foo2');
        });
      });

      it('keeps data at empty, nonconflicting keys', function(){
        return s.merge('foo', 'foo2').then(function(){
          return s.merge({ hello: { baz: 'bat' } });
        }).then(function(){
          return s.merge({ hello: { bof: 'bin' } });
        }).then(function(){
          return reload( s );
        }).then(function( s2 ){
          expect( s2.get() ).to.have.property('foo', 'foo2');
          expect( s2.get('hello') ).to.deep.equal({ baz: 'bat', bof: 'bin' });
        });
      });

      it('handles conflicting top-level key with type override', function(){
        return s.merge('foo', 'foo2').then(function(){
          return s.merge({ bar: { baz: 'bat' } });
        }).then(function(){
          return s.merge({ bar: { bof: 'bin' } });
        }).then(function(){
          return reload( s );
        }).then(function( s2 ){
          expect( s2.get() ).to.have.property('foo', 'foo2');
          expect( s2.get('bar') ).to.deep.equal({ baz: 'bat', bof: 'bin' });
        });
      });

      it('handles deep objects', function(){
        return s.merge({
          a: {
            b: {
              c: 1,
              d: 2
            },
            e: 3
          },
          f: {
            g: {
              h: 4
            }
          }
        }).then(function(){
          return s.merge({
            a: {
              b: {
                i: 5
              }
            },
            f: {
              g: {
                h: 6,
                k: 8
              },
              j: 7
            }
          });
        }).then(function(){
          return reload( s );
        }).then(function( s2 ){
          expect( s2.get('a') ).to.deep.equal({
            b: {
              c: 1,
              d: 2,
              i: 5
            },
            e: 3
          });

          expect( s2.get('f') ).to.deep.equal({
            g: {
              h: 6,
              k: 8
            },
            j: 7
          });
        });
      });
    });

    describe('(push)', function(){
      beforeEach(function(){
        s.get().foo = [ 'foo1' ];

        return s.create();
      });

      if( clientside ){
        it('pushes only locally if unfilled', function(){
          let s2 = copy( s );
          let s3 = copy( s );

          s2.push('foo', 'foo-unfilled');

          return s3.load().then(function(){
            expect( s3.get('foo') ).to.deep.equal(['foo1']);
          });
        });
      }

      it('puts changes in emitted event', function( done ){
        s.on('update', function( changes ){
          expect( changes ).to.have.property('foo');
          expect( changes.foo ).to.deep.equal(['foo1', 'foo2']);

          done();
        });

        s.push({ foo: 'foo2' });
      });

      it('updates in db if filled', function(){
        return s.push('foo', 'foo2').then(function(){
          return reload( s );
        }).then(function( s2 ){
          expect( s2.get() ).to.have.property('foo');
          expect( s2.get('foo') ).to.deep.equal(['foo1', 'foo2']);
        });
      });

      it('keeps prior data', function(){
        return s.push('foo', 1).then(function(){
          return s.push('foo', 2);
        }).then(function(){
          return s.push('foo', 3);
        }).then(function(){
          return reload( s );
        }).then(function( s2 ){
          expect( s2.get() ).to.have.property('foo');
          expect( s2.get('foo') ).to.deep.equal(['foo1', 1, 2, 3]);
        });
      });
    });

    describe('(pull)', function(){
      beforeEach(function(){
        s.get().foo = [1, 2, 3, 4, 5];

        return s.create();
      });

      if( clientside ){
        it('pulls only locally if unfilled', function(){
          let s2 = copy( s );
          let s3 = copy( s );

          s2.pull('foo', 3);

          return s3.load().then(function(){
            expect( s3.get('foo') ).to.deep.equal([1, 2, 3, 4, 5]);
          });
        });
      }

      it('puts changes in emitted event', function( done ){
        s.on('update', function( changes ){
          expect( changes ).to.have.property('foo');
          expect( changes.foo ).to.deep.equal([1, 2, 4, 5]);

          done();
        });

        s.pull({ foo: 3 });
      });

      it('updates in db if filled', function(){
        return s.pull('foo', 3).then(function(){
          return reload( s );
        }).then(function( s2 ){
          expect( s2.get() ).to.have.property('foo');
          expect( s2.get('foo') ).to.deep.equal([1, 2, 4, 5]);
        });
      });

      it('keeps prior data', function(){
        return s.pull('foo', 3).then(function(){
          return s.pull('foo', 5);
        }).then(function(){
          return s.pull('foo', 2);
        }).then(function(){
          return reload( s );
        }).then(function( s2 ){
          expect( s2.get() ).to.have.property('foo');
          expect( s2.get('foo') ).to.deep.equal([1, 4]);
        });
      });
    });

    describe('(pullById)', function(){
      beforeEach(function(){
        s.get().foo = [
          { id: 'id1', a: 1 },
          { id: 'id2', a: 2 },
          { id: 'id3', a: 3 },
          { id: 'id4', a: 4 },
          { id: 'id5', a: 5 }
        ];

        return s.create();
      });

      if( clientside ){
        it('pulls only locally if unfilled', function(){
          let s2 = copy( s );
          let s3 = copy( s );

          s2.pullById('foo', 'id3');

          return s3.load().then(function(){
            expect( s3.get('foo') ).to.deep.equal([
              { id: 'id1', a: 1 },
              { id: 'id2', a: 2 },
              { id: 'id3', a: 3 },
              { id: 'id4', a: 4 },
              { id: 'id5', a: 5 }
            ]);
          });
        });
      }

      it('puts changes in emitted event', function( done ){
        s.on('update', function( changes ){
          expect( changes ).to.have.property('foo');
          expect( changes.foo ).to.deep.equal([
            { id: 'id1', a: 1 },
            { id: 'id2', a: 2 },
            { id: 'id4', a: 4 },
            { id: 'id5', a: 5 }
          ]);

          done();
        });

        s.pullById({ foo: 'id3' });
      });

      it('updates in db if filled', function(){
        return s.pullById('foo', 'id3').then(function(){
          return reload( s );
        }).then(function( s2 ){
          expect( s2.get() ).to.have.property('foo');
          expect( s2.get('foo') ).to.deep.equal([
            { id: 'id1', a: 1 },
            { id: 'id2', a: 2 },
            { id: 'id4', a: 4 },
            { id: 'id5', a: 5 }
          ]);
        });
      });

      it('keeps prior data', function(){
        return s.pullById('foo', 'id3').then(function(){
          return s.pullById('foo', 'id5');
        }).then(function(){
          return s.pullById('foo', 'id2');
        }).then(function(){
          return reload( s );
        }).then(function( s2 ){
          expect( s2.get() ).to.have.property('foo');
          expect( s2.get('foo') ).to.deep.equal([
            { id: 'id1', a: 1 },
            { id: 'id4', a: 4 }
          ]);
        });
      });
    });

    describe('(destroy)', function(){
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

    describe('(json)', function(){
      it('gives the json representation', function(){
        let json = s.json();

        expect( json ).to.have.property('id');
        expect( json ).to.have.property('foo', 'foo');
        expect( json ).to.have.property('bar', 'bar');
        expect( json ).to.have.property('baz', 321);
        expect( json ).to.not.have.property('secret');

        // should be proper, stringifiable json
        expect( JSON.parse( JSON.stringify( json ) ) ).to.deep.equal( json );
      });
    });
  };

  describe('(client)', function(){
    beforeEach(function(){
      let socket = new MockSocket();

      s = new Syncher({
        socket: socket,
        data: {
          secret: 'secret',
          foo: 'foo',
          bar: 'bar',
          baz: 321
        }
      });

      socket.syncher = s;

      clientside = true;
      serverside = false;
    });

    describeCommonTests();
  });

  function serverPrePost(){
    before(function( done ){
      clientside = true;
      serverside = false;

      tableUtil = new TableUtil( NS );

      tableUtil.clean(function(){
        tableUtil.create( done );
      });
    });

    afterEach(function( done ){
      tableUtil.deleteEntry( s.get().id, done );
    });

    after(function( done ){
      tableUtil.drop( done );
    });
  }

  describe('(server)', function(){
    serverPrePost();

    beforeEach(function( done ){
      s = new Syncher({
        rethink: tableUtil.rethink,
        table: tableUtil.table,
        conn: tableUtil.conn,
        data: {
          secret: 'secret',
          foo: 'foo',
          bar: 'bar',
          baz: 321
        }
      });

      done();
    });

    describeCommonTests();
  });

  describe('(client and server synch)', function(){
    let sc, ss; // synched obj on client/server

    serverPrePost();

    before(function(){
      io.start();

      // set up serverside part of synch
      Syncher.synch({
        rethink: tableUtil.rethink,
        table: tableUtil.table,
        conn: tableUtil.conn,
        io: io.server( NS )
      });
    });

    after(function(){
      io.stop();
    });

    beforeEach(function( done ){
      sc = new Syncher({
        socket: io.client( NS ),
        data: {
          id: 'id',
          secret: 'secret',
          foo: 'foo',
          bar: 'bar',
          baz: 321
        }
      });

      s = ss = new Syncher({
        rethink: tableUtil.rethink,
        table: tableUtil.table,
        conn: tableUtil.conn,
        data: {
          id: 'id',
          secret: 'secret',
          foo: 'foo',
          bar: 'bar',
          baz: 321
        }
      });

      done();
    });

    describe('(create-load)', function(){

      it('creates on server, loads on client', function(){
        sc.get().foo = 'not-loaded';
        sc.get().bar = 'not-loaded';
        sc.get().baz = 'not-loaded';

        return ss.create().then(function(){
          return sc.load();
        }).then(function(){
          expect( sc.get() ).to.have.property('foo', 'foo');
          expect( sc.get() ).to.have.property('bar', 'bar');
          expect( sc.get() ).to.have.property('baz', 321);
        });
      });

      it('creates on client, loads on server', function(){
        ss.get().foo = 'not-loaded';
        ss.get().bar = 'not-loaded';
        ss.get().baz = 'not-loaded';

        return sc.create().then(function(){
          return ss.load();
        }).then(function(){
          expect( ss.get() ).to.have.property('foo', 'foo');
          expect( ss.get() ).to.have.property('bar', 'bar');
          expect( ss.get() ).to.have.property('baz', 321);
        });
      });
    });

    describe('(create-destroy-load)', function(){
      it('creates/destroys on server, loads on client', function(){
        sc.get().foo = 'not-loaded';
        sc.get().bar = 'not-loaded';
        sc.get().baz = 'not-loaded';

        return ss.create().then(function(){
          return ss.destroy();
        }).then(function(){
          return sc.load();
        }).then(function(){
          assert.fail('load should fail');
        }).catch(function( err ){
          expect( err ).to.exist;
        });
      });

      it('creates/destroys on client, loads on server', function(){
        ss.get().foo = 'not-loaded';
        ss.get().bar = 'not-loaded';
        ss.get().baz = 'not-loaded';

        return sc.create().then(function(){
          return sc.destroy();
        }).then(function(){
          return ss.load();
        }).then(function(){
          assert.fail('load should fail');
        }).catch(function( err ){
          expect( err ).to.exist;
        });
      });
    });

    describe('(create-update-load)', function(){
      it('creates/updates on server, loads on client', function(){
        sc.get().foo = 'not-loaded';
        sc.get().bar = 'not-loaded';
        sc.get().baz = 'not-loaded';

        return ss.create().then(function(){
          return ss.update('foo', 'foo2');
        }).then(function(){
          return sc.load();
        }).then(function(){
          expect( sc.get() ).to.have.property('foo', 'foo2');
          expect( sc.get() ).to.have.property('bar', 'bar');
          expect( sc.get() ).to.have.property('baz', 321);
        });
      });

      it('creates/merges on server, loads on client', function(){
        sc.get().foo = 'not-loaded';
        sc.get().bar = 'not-loaded';
        sc.get().baz = 'not-loaded';

        ss.get().foo = ({ a: 1 });

        return ss.create().then(function(){
          return ss.merge('foo', { b: 2 });
        }).then(function(){
          return sc.load();
        }).then(function(){
          expect( sc.get('foo') ).to.deep.equal({ a: 1, b: 2 });
          expect( sc.get() ).to.have.property('bar', 'bar');
          expect( sc.get() ).to.have.property('baz', 321);
        });
      });

      it('creates/pushes on server, loads on client', function(){
        sc.get().foo = 'not-loaded';
        sc.get().bar = 'not-loaded';
        sc.get().baz = 'not-loaded';

        ss.get().foo = [1];

        return ss.create().then(function(){
          return ss.push('foo', [2]);
        }).then(function(){
          return sc.load();
        }).then(function(){
          expect( sc.get('foo') ).to.deep.equal([1, 2]);
          expect( sc.get() ).to.have.property('bar', 'bar');
          expect( sc.get() ).to.have.property('baz', 321);
        });
      });

      it('creates/pulls on server, loads on client', function(){
        sc.get().foo = 'not-loaded';
        sc.get().bar = 'not-loaded';
        sc.get().baz = 'not-loaded';

        ss.get().foo = [1, 2, 3];

        return ss.create().then(function(){
          return ss.pull('foo', [2]);
        }).then(function(){
          return sc.load();
        }).then(function(){
          expect( sc.get('foo') ).to.deep.equal([1, 3]);
          expect( sc.get() ).to.have.property('bar', 'bar');
          expect( sc.get() ).to.have.property('baz', 321);
        });
      });

      it('creates/pulls by id on server, loads on client', function(){
        sc.get().foo = 'not-loaded';
        sc.get().bar = 'not-loaded';
        sc.get().baz = 'not-loaded';

        ss.get().foo = [{ id: 1, a: 1 }, { id: 2, a: 2 }, { id: 3, a: 3 }];

        return ss.create().then(function(){
          return ss.pullById('foo', [2]);
        }).then(function(){
          return sc.load();
        }).then(function(){
          expect( sc.get('foo') ).to.deep.equal([{ id: 1, a: 1 }, { id: 3, a: 3 }]);
          expect( sc.get() ).to.have.property('bar', 'bar');
          expect( sc.get() ).to.have.property('baz', 321);
        });
      });

      it('creates/updates on client, loads on server', function(){
        ss.get().foo = 'not-loaded';
        ss.get().bar = 'not-loaded';
        ss.get().baz = 'not-loaded';

        return sc.create().then(function(){
          return sc.update('foo', 'foo2');
        }).then(function(){
          return ss.load();
        }).then(function(){
          expect( ss.get() ).to.have.property('foo', 'foo2');
          expect( ss.get() ).to.have.property('bar', 'bar');
          expect( ss.get() ).to.have.property('baz', 321);
        });
      });

      it('creates/merges on client, loads on server', function(){
        ss.get().foo = 'not-loaded';
        ss.get().bar = 'not-loaded';
        ss.get().baz = 'not-loaded';

        sc.get().foo = ({ a: 1 });

        return sc.create().then(function(){
          return sc.merge('foo', { b: 2 });
        }).then(function(){
          return ss.load();
        }).then(function(){
          expect( ss.get('foo') ).to.deep.equal({ a: 1, b: 2 });
          expect( ss.get() ).to.have.property('bar', 'bar');
          expect( ss.get() ).to.have.property('baz', 321);
        });
      });

      it('creates/pushes on client, loads on server', function(){
        ss.get().foo = 'not-loaded';
        ss.get().bar = 'not-loaded';
        ss.get().baz = 'not-loaded';

        sc.get().foo = [1];

        return sc.create().then(function(){
          return sc.push('foo', [2]);
        }).then(function(){
          return ss.load();
        }).then(function(){
          expect( ss.get('foo') ).to.deep.equal([1, 2]);
          expect( ss.get() ).to.have.property('bar', 'bar');
          expect( ss.get() ).to.have.property('baz', 321);
        });
      });

      it('creates/pulls on client, loads on server', function(){
        ss.get().foo = 'not-loaded';
        ss.get().bar = 'not-loaded';
        ss.get().baz = 'not-loaded';

        sc.get().foo = [1, 2, 3];

        return sc.create().then(function(){
          return sc.pull('foo', [2]);
        }).then(function(){
          return ss.load();
        }).then(function(){
          expect( ss.get('foo') ).to.deep.equal([1, 3]);
          expect( ss.get() ).to.have.property('bar', 'bar');
          expect( ss.get() ).to.have.property('baz', 321);
        });
      });

      it('creates/pulls by id on client, loads on server', function(){
        ss.get().foo = 'not-loaded';
        ss.get().bar = 'not-loaded';
        ss.get().baz = 'not-loaded';

        sc.get().foo = [{ id: 1, a: 1 }, { id: 2, a: 2 }, { id: 3, a: 3 }];

        return sc.create().then(function(){
          return sc.pullById('foo', [2]);
        }).then(function(){
          return ss.load();
        }).then(function(){
          expect( ss.get('foo') ).to.deep.equal([{ id: 1, a: 1 }, { id: 3, a: 3 }]);
          expect( ss.get() ).to.have.property('bar', 'bar');
          expect( ss.get() ).to.have.property('baz', 321);
        });
      });
    });

    describe('(security of update via secrets)', function(){
      it('allows update with correct secret (client)', function(){
        return sc.create().then(function(){
          return sc.update('foo', 'foo2');
        }).then(function(){
          return reload( sc );
        }).then(function( sc2 ){
          expect( sc2.get() ).to.have.property('foo', 'foo2');
        });
      });

      it('allows update with correct secret (server)', function(){
        return ss.create().then(function(){
          return copy( ss );
        }).then(function( ss2 ){
          return ss2.update('foo', 'foo2');
        }).then(function( ss2 ){
          return reload( ss2 );
        }).then(function( ss3 ){
          expect( ss3.get() ).to.have.property('foo', 'foo2');
        });
      });

      it('allows update without correct secret in private mode (server)', function(){
        return ss.create().then(function(){
          return copy( ss );
        }).then(function( ss2 ){
          ss2.get().secret = 'bad-secret';
          ss2.isPrivate = true;

          return ss2.update('foo', 'foo2');
        }).then(function( ss2 ){
          return reload( ss2 );
        }).then(function( ss3 ){
          expect( ss3.get() ).to.have.property('foo', 'foo2');
        });
      });

      it('disallows update without correct secret (client)', function(){
        sc.get().secret = 'bad-secret';

        return ss.create().then(function(){
          return sc.load();
        }).then(function(){
          return sc.update('foo', 'foo2');
        }).then(function(){
          assert.fail('update should have failed');
        }).catch(function(err){
          expect( err ).to.exist;
        });
      });

      it('disallows update without correct secret (server)', function(){
        return ss.create().then(function(){
          return copy( ss );
        }).then(function( ss2 ){
          ss2.get().secret = 'bad-secret';

          return ss2.update('foo', 'foo2');
        }).then(function(){
          assert.fail('update should fail');
        }).catch(function( err ){
          expect( err ).to.exist;
        });
      });
    });

    describe('(security of destroy via secrets)', function(){
      let assertDestroyFailed = (promise) => {
        return promise.then(function(){
          assert.fail('destroy should fail');
        }).catch(function( err ){
          expect( err ).to.exist;
        }).then(function(){
          return reload( s );
        }).then(function( s2 ){
          expect( s2.get() ).to.have.property('foo', 'foo');
          expect( s2.get() ).to.have.property('bar', 'bar');
          expect( s2.get() ).to.have.property('baz', 321);
        });
      };

      let assertDestroySucceeded = (s) => {
        return Promise.resolve().then(function(){
          return reload( s );
        }).then(function(){
          assert.fail('load should fail on destroyed entry');
        }).catch(function( err ){
          expect( err ).to.exist; // i.e. entry doesn't exist anymore
        });
      };

      it('allows destroy with correct secret (client)', function(){
        return sc.create().then(function(){
          return sc.destroy();
        }).then( assertDestroySucceeded );
      });

      it('allows destroy with correct secret (server)', function(){
        return ss.create().then(function(){
          return copy( ss );
        }).then(function( ss2 ){
          return ss2.destroy();
        }).then( assertDestroySucceeded );
      });

      it('allows destroy without correct secret in private mode (server)', function(){
        return ss.create().then(function(){
          return copy( ss );
        }).then(function( ss2 ){
          ss2.get().secret = 'bad-secret';
          ss2.isPrivate = true;

          return ss2.destroy();
        }).then( assertDestroySucceeded );
      });

      it('disallows destroy without correct secret (client)', function(){
        sc.get().secret = 'bad-secret';

        return assertDestroyFailed( ss.create().then(function(){
          return sc.load();
        }).then(function(){
          return sc.destroy();
        }) );
      });

      it('disallows destroy without correct secret (server)', function(){
        return assertDestroyFailed( ss.create().then(function(){
          return copy( ss );
        }).then(function( ss2 ){
          ss2.get().secret = 'bad-secret';

          return ss2.destroy();
        }) );
      });
    });

    describe('(security of update via locking)', function(){
      it('allows updating when unlocked', function(){
        return (
          ss.create() // unlocked by default
          .then( () => sc.load() )
          .then( () => sc.update({ foo: 'bar' }) )
          .then( () => reload(sc) )
          .then( sr => expect( sr.get('foo') ).to.equal('bar') )
        );
      });

      it('can not set lock key via update', function(){
        return (
          ss.create() // unlocked by default
          .then( () => sc.load() )
          .then( () => sc.update({ lock: 'bar' }) )
          .then( () => reload(sc) )
          .then( sr => expect( sr.get('lock') ).to.not.equal('bar') )
        );
      });

      it('server can not override lock key via update', function(){
        return (
          ss.create() // unlocked by default
          .then( () => reload(ss) )
          .then( sr => sr.update({ lock: 'bar' }) )
          .then( () => reload(ss) )
          .then( sr => expect( sr.get('lock') ).to.not.equal('bar') )
        );
      });

      it('disallows updating when locked', function(){
        let caught = null;

        return (
          ss.create() // unlocked by default
          .then( () => ss.lock() )
          .then( () => sc.load() )
          .then( () => sc.update({ foo: 'bar' }) )
          .then( () => caught = false, () => caught = true )
          .then( () => reload(sc) )
          .then( sr => {
            expect( sr.get('foo') ).to.not.equal('bar');
            expect( caught ).to.be.true;
          } )
        );
      });

      it('disallows updating when locked (server)', function(){
        let caught = null;

        return (
          ss.create() // unlocked by default
          .then( () => ss.lock() )
          .then( () => ss.update({ foo: 'bar' }) )
          .then( () => caught = false, () => caught = true )
          .then( () => reload(ss) )
          .then( sr => {
            expect( sr.get('foo') ).to.not.equal('bar');
            expect( caught ).to.be.true;
          } )
        );
      });

      it('gets marked as locked after promise resolves', function(){
        return (
          ss.create() // unlocked by default
          .then( () => sc.load() )
          .then( () => sc.lock() )
          .then( () => expect( sc.locked() ).to.be.true )
        );
      });

      it('gets marked as locked after promise resolves (server)', function(){
        return (
          ss.create() // unlocked by default
          .then( () => ss.lock() )
          .then( () => expect( ss.locked() ).to.be.true )
        );
      });

      it('gets lock event', function(){
        let eventPromise = new Promise( resolve => sc.on('lock', resolve) );

        ss.create().then( () => sc.load() ).then( () => sc.lock() );

        return eventPromise;
      });

      it('gets lock event (server)', function(){
        let eventPromise = new Promise( resolve => ss.on('lock', resolve) );

        ss.create().then( () => ss.lock() );

        return eventPromise;
      });

      it('gets unlock event', function(){
        let eventPromise = new Promise( resolve => sc.on('unlock', resolve) );
        let key = 'key';

        ss.create().then( () => sc.load() ).then( () => sc.lock(key) ).then( () => sc.unlock(key) );

        return eventPromise;
      });

      it('gets unlock event (server)', function(){
        let eventPromise = new Promise( resolve => ss.on('unlock', resolve) );
        let key = 'key';

        ss.create().then( () => ss.lock(key) ).then( () => ss.unlock(key) );

        return eventPromise;
      });

      it('data reports unlocked after unlock (server)', function(){
        let key = 'key';

        return (
          ss.create()
          .then( () => ss.lock(key) )
          .then( () => ss.unlock(key) )
          .then( () => reload(ss) )
          .then( sr => {
            expect( sr.get('locked') ).to.be.false;
            expect( sr.get('lock') ).to.not.exist;
          })
        );
      });

      it('data reports unlocked after unlock', function(){
        let key = 'key';

        return (
          ss.create()
          .then( () => sc.load() )
          .then( () => sc.lock(key) )
          .then( () => sc.unlock(key) )
          .then( () => reload(sc) )
          .then( sr => {
            expect( sr.get('locked') ).to.be.false;
            expect( sr.get('lock') ).to.not.exist;
          })
        );
      });

      it('can write after unlock (server)', function(){
        let key = 'key';

        return (
          ss.create()
          .then( () => ss.lock(key) )
          .then( () => ss.unlock(key) )
          .then( () => ss.update({ foo: 'bar' }) )
          .then( () => reload(ss) )
          .then( sr => expect( sr.get('foo') ).to.equal('bar') )
        );
      });

      it('can write after unlock', function(){
        let key = 'key';

        return (
          ss.create()
          .then( () => sc.load() )
          .then( () => sc.lock(key) )
          .then( () => sc.unlock(key) )
          .then( () => sc.update({ foo: 'bar' }) )
          .then( () => reload(sc) )
          .then( sr => expect( sr.get('foo') ).to.equal('bar') )
        );
      });

      it('disallows destroying when locked', function(){
        let caught = null;

        return (
          ss.create() // unlocked by default
          .then( () => ss.lock() )
          .then( () => sc.load() )
          .then( () => sc.destroy() )
          .then( () => caught = false, () => caught = true )
          .then( () => reload(sc) )
          .then( () => {
            expect( caught ).to.be.true;
          } )
        );
      });

      it('disallows destroying when locked (server)', function(){
        let caught = null;

        return (
          ss.create() // unlocked by default
          .then( () => ss.lock() )
          .then( () => sc.load() )
          .then( () => sc.destroy() )
          .then( () => caught = false, () => caught = true )
          .then( () => reload(sc) )
          .then( () => {
            expect( caught ).to.be.true;
          } )
        );
      });
    });

    describe('(client-client live synch)', function(){
      let sc2;

      beforeEach(function(){
        sc2 = new Syncher({
          socket: io.client( NS ),
          data: {
            id: 'id',
            secret: 'secret',
            foo: 'foo',
            bar: 'bar',
            baz: 321
          }
        });

        // enable live synch on client instances
        return Promise.all([
          sc.synch(),
          sc2.synch()
        ]);
      });

      afterEach(function(){
        return Promise.all([
          sc.synch( false ),
          sc2.synch( false )
        ]);
      });

      it('has immutible liveId for multiple clients', function(){
        return sc.create().then(function(){
          return sc2.load();
        }).then(function(){
          return sc.update('foo', 'foo2');
        }).then(function(){
          expect( sc2.get().liveId ).to.not.equal( sc.get().liveId );
        });
      });

      it('fails to overwrite existing object with same id', function(){
        let fail;

        return sc.create().then(function(){
          return sc2.create();
        }).then(function(){
          fail = false;
        }).catch(function(){
          fail = true;
        }).finally(function(){
          expect( fail, 'fail' ).to.be.true;
        });
      });

      it('creates on client1, loads on client2', function(){
        return sc.update('foo', 'foo2').then(function(){
        }).then(function(){
          return sc.create();
        }).then(function(){
          return sc2.load();
        }).then(function(){
          expect( sc2.get() ).to.have.property('foo', 'foo2');
        });
      });

      it('destroys on client1, heard by client2', function( done ){
        sc2.on('destroy', done);

        sc.create().then(function(){
          return sc2.load();
        }).then(function(){
          return sc.destroy();
        });
      });

      it('destroys on client2, heard by client1', function( done ){
        sc.on('destroy', done);

        sc.create().then(function(){
          return sc2.load();
        }).then(function(){
          return sc2.destroy();
        });
      });

      it('updates on client1, heard by client2', function( done ){
        sc2.on('update', function(){
          expect( sc2.get() ).to.have.property('foo', 'foo2');

          done();
        });

        sc.create().then(function(){
          return sc2.load();
        }).then(function(){
          return sc.update('foo', 'foo2');
        });
      });

      it('updates on client2, heard by client1', function( done ){
        sc.on('update', function(){
          expect( sc.get() ).to.have.property('foo', 'foo2');

          done();
        });

        sc.create().then(function(){
          return sc2.load();
        }).then(function(){
          return sc2.update('foo', 'foo2');
        });
      });

      it('updates to delete property on client1, heard by client2', function( done ){
        sc2.on('update', function( diff ){
          expect( sc2.get() ).to.have.property('foo', null);
          expect( diff ).to.have.property('foo', null);

          done();
        });

        sc.create().then(function(){
          return sc2.load();
        }).then(function(){
          return sc.update('foo', null); // delete foo
        });
      });

      it('updates to delete property on client1, heard by client2', function( done ){
        sc.on('update', function( diff ){
          expect( sc.get() ).to.have.property('foo', null);
          expect( diff ).to.have.property('foo', null);

          done();
        });

        sc.create().then(function(){
          return sc2.load();
        }).then(function(){
          return sc2.update('foo', null); // delete foo
        });
      });

      it('updates on client1, heard by client2, then vice versa', function( done ){
        let seqExpected = [
          '1-reg', '2-rem', '2-reg', // client1 updates
          '2-reg', '1-rem', '1-reg' // client2 updates
        ];
        let seq = [];
        let update = {
          remote: id => {
            seq.push(id + '-rem');
            checkDone();
          },
          regular: id => {
            seq.push(id + '-reg');
            checkDone();
          }
        };

        let checkDone = _.debounce( () => {
          let seqStr = seq.join(',');
          let expStr = seqExpected.join(',');

          expect( seqStr, 'all events' ).to.equal( expStr );
          if( seqStr === expStr ){ done(); }
        }, 500 );

        sc.on('update', function(){ update.regular(1); });
        sc.on('remoteupdate', function(){ update.remote(1); });

        sc2.on('update', function(){ update.regular(2); });
        sc2.on('remoteupdate', function(){ update.remote(2); });

        // NB must use events for phases, because promises only let you know if
        // your write was acked by the server -- not whether other clients heard it

        sc.create().then(function(){
          return sc2.load(); // prep
        }).then(function(){
          sc2.once('update', function(){
            let seqStr = seq.join(',');
            let expStr = seqExpected.slice(0, 3).join(',');

            expect( seqStr, 'first three events' ).to.equal( expStr );

            sc2.update('foo', 'foo3'); // kick off second 3 events
          });

          sc.update('foo', 'foo2'); // kick off first 3 events
        });
      });

      it('gets remote updates only for the same id with same socket', function( done ){
        sc2.data.id = sc.data.id;
        sc2.data.obj = { a: 1 };
        sc.data.obj = { a: 1 };

        let s2c2 = new Syncher({
          socket: sc2.socket,
          data: {
            id: 'id2',
            secret: 'secret',
            foo: 'foo',
            bar: 'bar',
            baz: 321,
            liveId: sc2.data.liveId,
            obj: { a: 2 }
          }
        });

        s2c2.on('remoteupdate', () => {
          throw new Error('Got unexpected remote update');
        });

        s2c2.on('update', () => {
          throw new Error('Got unexpected update');
        });

        Promise.resolve().then( () => {
          return s2c2.synch( true );
        } ).then( () => {
          return Promise.all([ sc.create(), s2c2.create() ]);
        } ).then( () => {
          return sc2.load();
        } ).then( () => {
          return delay( 300 );
        } ).then( () => {
          return sc.update('obj', { a: 3 });
        } ).then( () => {
          return delay( 300 );
        } ).then( () => {
          s2c2.synch( false );

          expect( s2c2.get('obj') ).to.deep.equal({ a: 2 });

          done();
        } );
      });

      it('merges on client1, heard by client2', function( done ){
        sc2.on('update', function(){
          expect( sc2.get('foo') ).to.deep.equal({ a: 1, d: 4, b: { c: 5, e: 6, k: 3 } });

          done();
        });

        sc.get().foo = { a: 1, b: { c: 2, k: 3 } };

        sc.create().then(function(){
          return sc2.load();
        }).then(function(){
          return sc.merge('foo', { d: 4, b: { c: 5, e: 6 } });
        });
      });

      it('merges on client2, heard by client1', function( done ){
        sc.on('update', function(){
          expect( sc.get('foo') ).to.deep.equal({ a: 1, d: 4, b: { c: 5, e: 6, k: 3 } });

          done();
        });

        sc.get().foo = { a: 1, b: { c: 2, k: 3 } };

        sc.create().then(function(){
          return sc2.load();
        }).then(function(){
          return sc2.merge('foo', { d: 4, b: { c: 5, e: 6 } });
        });
      });

      it('merges simultaneously, resolves both clients', function( done ){
        sc2.get().foo = { a: 1, b: { c: 2 } };

        sc2.create().then(function(){
          return sc.load();
        }).then(function(){
          let updated = whenAllRemoteupdates( [ sc, sc2 ] );

          sc.merge('foo', { a: 3 });
          sc2.merge('foo', { b: { c: 4 } });

          return updated;
        }).then(function(){
          expect( sc.get('foo'), 'client1').to.deep.equal({ a: 3, b: { c: 4 } });
          expect( sc.get('foo'), 'client2').to.deep.equal({ a: 3, b: { c: 4 } });

          done();
        });
      });

      it('pushes 1 val on client1, heard on client2', function( done ){
        sc2.on('update', function(){
          expect( sc2.get('foo') ).to.deep.equal([ 1, 2, 3, 4 ]);

          done();
        });

        sc.get().foo = [ 1, 2, 3 ];

        sc.create().then(function(){
          return sc2.load();
        }).then(function(){
          return sc.push('foo', 4);
        });
      });

      it('pushes 1 val on client2, heard on client1', function( done ){
        sc.on('update', function(){
          expect( sc.get('foo') ).to.deep.equal([ 1, 2, 3, 4 ]);

          done();
        });

        sc.get().foo = [ 1, 2, 3 ];

        sc.create().then(function(){
          return sc2.load();
        }).then(function(){
          return sc2.push('foo', 4);
        });
      });

      it('pushes 2 vals on client1, heard on client2', function( done ){
        sc2.on('update', function(){
          expect( sc2.get('foo') ).to.deep.equal([ 1, 2, 3, 4, 5 ]);

          done();
        });

        sc.get().foo = [ 1, 2, 3 ];

        sc.create().then(function(){
          return sc2.load();
        }).then(function(){
          return sc.push('foo', [4, 5]);
        });
      });

      it('pushes 2 vals on client2, heard on client1', function( done ){
        sc.on('update', function(){
          expect( sc.get('foo') ).to.deep.equal([ 1, 2, 3, 4, 5 ]);

          done();
        });

        sc.get().foo = [ 1, 2, 3 ];

        sc.create().then(function(){
          return sc2.load();
        }).then(function(){
          return sc2.push('foo', [4, 5]);
        });
      });

      it('pushes simultaneously, resolves both clients', function( done ){
        sc.get().foo = [ 1, 2, 3 ];

        sc.create().then(function(){
          return sc2.load();
        }).then(function(){
          let updated = whenAllRemoteupdates([ sc, sc2 ]);

          sc.push('foo', 10);
          sc2.push('foo', 11);

          return updated;
        }).then(function(){
          // client1
          expect( sc.get('foo').slice( 0, 3 ),  '1st - 3rd c1' ).to.deep.equal([ 1, 2, 3 ]);
          expect( sc.get('foo')[3] === 10 || sc.get('foo')[3] === 11, '4th is 10 or 11 c1' ).to.be.true;
          expect( sc.get('foo')[4] === 10 || sc.get('foo')[4] === 11, '5th is 10 or 11 c1' ).to.be.true;
          expect( sc.get('foo')[3] !== sc.get('foo')[4], '4th and 5th different c1' ).to.be.true;

          // client2
          expect( sc2.get('foo').slice( 0, 3 ), '1st - 3rd c2' ).to.deep.equal([ 1, 2, 3 ]);
          expect( sc2.get('foo')[3] === 10 || sc2.get('foo')[3] === 11, '4th is 10 or 11 c2' ).to.be.true;
          expect( sc2.get('foo')[4] === 10 || sc2.get('foo')[4] === 11, '5th is 10 or 11 c2' ).to.be.true;
          expect( sc2.get('foo')[3] !== sc2.get('foo')[4], '4th and 5th different c2' ).to.be.true;

          done();
        });
      });

      it('pulls 1 val on client1, heard on client2', function( done ){
        sc2.on('update', function(){
          expect( sc2.get('foo') ).to.deep.equal([ 1, 2 ]);

          done();
        });

        sc.get().foo = [ 1, 2, 3 ];

        sc.create().then(function(){
          return sc2.load();
        }).then(function(){
          return sc.pull('foo', 3);
        });
      });

      it('pulls 1 val on client2, heard on client1', function( done ){
        sc.on('update', function(){
          expect( sc.get('foo') ).to.deep.equal([ 1, 2 ]);

          done();
        });

        sc.get().foo = [ 1, 2, 3 ];

        sc.create().then(function(){
          return sc2.load();
        }).then(function(){
          return sc2.pull('foo', 3);
        });
      });

      it('pulls 2 vals on client1, heard on client2', function( done ){
        sc2.on('update', function(){
          expect( sc2.get('foo') ).to.deep.equal([ 2 ]);

          done();
        });

        sc.get().foo = [ 1, 2, 3 ];

        sc.create().then(function(){
          return sc2.load();
        }).then(function(){
          return sc.pull('foo', [ 1, 3 ]);
        });
      });

      it('pulls 2 vals on client2, heard on client1', function( done ){
        sc.on('update', function(){
          expect( sc.get('foo') ).to.deep.equal([ 2 ]);

          done();
        });

        sc.get().foo = [ 1, 2, 3 ];

        sc.create().then(function(){
          return sc2.load();
        }).then(function(){
          return sc2.pull('foo', [ 1, 3 ]);
        });
      });

      it('pulls simultaneously on each client', function( done ){
        sc.get().foo = [ 1, 2, 3, 4, 5, 6 ];

        sc.create().then(function(){
          return sc2.load();
        }).then(function(){
          let updated = new Promise( resolve => {
            // use debounce since error correction updates could introduce extra updates
            let onUpdate = _.debounce( resolve, 1000 ); // n.b. liberal duration, in case slow test machine etc.

            sc.on('update', onUpdate);
            sc.on('remoteupdate', onUpdate);
            sc2.on('update', onUpdate);
            sc2.on('remoteupdate', onUpdate);
          } );

          sc.pull('foo',  1);
          sc2.pull('foo', 5);
          sc.pull('foo',  4);
          sc2.pull('foo', 3);

          return updated;
        }).then(function(){
          expect(  sc.get('foo') ).to.deep.equal([ 2, 6 ]);
          expect( sc2.get('foo') ).to.deep.equal([ 2, 6 ]);

          done();
        });
      });

      it('pulls 1 val by id on client1, heard on client2', function( done ){
        sc2.on('update', function(){
          expect( sc2.get('foo') ).to.deep.equal([
            { id: 'bar1', a: 1 },
            { id: 'bar2', a: 2 },
            { id: 'bar4', a: 4 },
            { id: 'bar5', a: 5 },
            { id: 'bar6', a: 6 }
          ]);

          done();
        });

        sc.get().foo = [
          { id: 'bar1', a: 1 },
          { id: 'bar2', a: 2 },
          { id: 'bar3', a: 3 },
          { id: 'bar4', a: 4 },
          { id: 'bar5', a: 5 },
          { id: 'bar6', a: 6 }
        ];

        sc.create().then(function(){
          return sc2.load();
        }).then(function(){
          return sc.pullById('foo', 'bar3');
        });
      });

      it('pulls 2 vals by id on client1, heard on client2', function( done ){
        sc2.on('update', function(){
          expect( sc2.get('foo') ).to.deep.equal([
            { id: 'bar2', a: 2 },
            { id: 'bar4', a: 4 },
            { id: 'bar5', a: 5 },
            { id: 'bar6', a: 6 }
          ]);

          done();
        });

        sc.get().foo = [
          { id: 'bar1', a: 1 },
          { id: 'bar2', a: 2 },
          { id: 'bar3', a: 3 },
          { id: 'bar4', a: 4 },
          { id: 'bar5', a: 5 },
          { id: 'bar6', a: 6 }
        ];

        sc.create().then(function(){
          return sc2.load();
        }).then(function(){
          return sc.pullById('foo', ['bar3', 'bar1']);
        });
      });

      it('pulls 1 val by id on client2, heard on client1', function( done ){
        sc.on('update', function(){
          expect( sc.get('foo') ).to.deep.equal([
            { id: 'bar1', a: 1 },
            { id: 'bar2', a: 2 },
            { id: 'bar4', a: 4 },
            { id: 'bar5', a: 5 },
            { id: 'bar6', a: 6 }
          ]);

          done();
        });

        sc2.get().foo = [
          { id: 'bar1', a: 1 },
          { id: 'bar2', a: 2 },
          { id: 'bar3', a: 3 },
          { id: 'bar4', a: 4 },
          { id: 'bar5', a: 5 },
          { id: 'bar6', a: 6 }
        ];

        sc2.create().then(function(){
          return sc.load();
        }).then(function(){
          return sc2.pullById('foo', 'bar3');
        });
      });

      it('pulls 2 vals by id on client2, heard on client1', function( done ){
        sc.on('update', function(){
          expect( sc.get('foo') ).to.deep.equal([
            { id: 'bar2', a: 2 },
            { id: 'bar4', a: 4 },
            { id: 'bar5', a: 5 },
            { id: 'bar6', a: 6 }
          ]);

          done();
        });

        sc2.get().foo = [
          { id: 'bar1', a: 1 },
          { id: 'bar2', a: 2 },
          { id: 'bar3', a: 3 },
          { id: 'bar4', a: 4 },
          { id: 'bar5', a: 5 },
          { id: 'bar6', a: 6 }
        ];

        sc2.create().then(function(){
          return sc.load();
        }).then(function(){
          return sc2.pullById('foo', ['bar3', 'bar1']);
        });
      });

      it('pulls by id simultaneously on each client', function( done ){
        sc.get().foo = [
          { id: 'bar1', a: 1 }, // rm 1
          { id: 'bar2', a: 2 },
          { id: 'bar3', a: 3 }, // rm 2
          { id: 'bar4', a: 4 }, // rm 1
          { id: 'bar5', a: 5 }, // rm 2
          { id: 'bar6', a: 6 }
        ];

        sc.create().then(function(){
          return sc2.load();
        }).then(function(){
          let updated = Promise.all([
            when( sc, 'remoteupdate', 2 ),
            when( sc2, 'remoteupdate', 2 )
          ]);

          sc.pullById( 'foo', 'bar1');
          sc2.pullById('foo', 'bar5');
          sc.pullById( 'foo', 'bar4');
          sc2.pullById('foo', 'bar3');

          return updated;
        }).then(function(){
          expect(  sc.get('foo'), 'client1' ).to.deep.equal([
            { id: 'bar2', a: 2 },
            { id: 'bar6', a: 6 }
          ]);

          expect( sc2.get('foo'), 'client2' ).to.deep.equal([
            { id: 'bar2', a: 2 },
            { id: 'bar6', a: 6 }
          ]);

          done();
        });
      });

      it('merges by id on client1, resolves on client2', function(){
        sc.get().foo = [
          { id: 'bar1', a: 1 },
          { id: 'bar2', a: 2 },
          { id: 'bar3', a: 3 },
          { id: 'bar4', a: 4 },
          { id: 'bar5', a: 5 },
          { id: 'bar6', a: 6 }
        ];

        let expected = [
          { id: 'bar1', a: 11, b: 22 },
          { id: 'bar2', a: 2 },
          { id: 'bar3', a: 3 },
          { id: 'bar4', a: 4 },
          { id: 'bar5', a: 5 },
          { id: 'bar6', a: 6 }
        ];

        let whenHeard = new Promise( resolve => sc2.on('update', resolve) );

        return sc.create().then(function(){
          return sc2.load();
        }).then(function(){
          return sc.mergeById('foo', { id: 'bar1', a: 11, b: 22 });
        }).then(function(){
          expect(  sc.get('foo') ).to.deep.equal( expected );
        }).then(function(){
          return whenHeard;
        }).then(function(){
          expect(  sc2.get('foo') ).to.deep.equal( expected );
        });
      });

      it('merges by id on client2, resolves on client1', function(){
        sc.get().foo = [
          { id: 'bar1', a: 1 },
          { id: 'bar2', a: 2 },
          { id: 'bar3', a: 3 },
          { id: 'bar4', a: 4 },
          { id: 'bar5', a: 5 },
          { id: 'bar6', a: 6 }
        ];

        let expected = [
          { id: 'bar1', a: 11, b: 22 },
          { id: 'bar2', a: 2 },
          { id: 'bar3', a: 3 },
          { id: 'bar4', a: 4 },
          { id: 'bar5', a: 5 },
          { id: 'bar6', a: 6 }
        ];

        let whenHeard = new Promise( resolve => sc.on('update', resolve) );

        return sc.create().then(function(){
          return sc2.load();
        }).then(function(){
          return sc2.mergeById('foo', { id: 'bar1', a: 11, b: 22 });
        }).then(function(){
          expect(  sc2.get('foo') ).to.deep.equal( expected );
        }).then(function(){
          return whenHeard;
        }).then(function(){
          expect(  sc.get('foo') ).to.deep.equal( expected );
        });
      });

      it('merges by id simultaneously', function(){
        sc.get().foo = [
          { id: 'bar1', a: 1 },
          { id: 'bar2', a: 2 },
          { id: 'bar3', a: 3 },
          { id: 'bar4', a: 4 },
          { id: 'bar5', a: 5 },
          { id: 'bar6', a: 6 }
        ];

        let expected = [
          { id: 'bar1', a: 11, b: 22, c: 33 },
          { id: 'bar2', a: 2 },
          { id: 'bar3', a: 3 },
          { id: 'bar4', a: 4 },
          { id: 'bar5', a: 5 },
          { id: 'bar6', a: 6 }
        ];

        return sc.create().then(function(){
          return sc2.load();
        }).then(function(){
          let updated = whenAllRemoteupdates([ sc, sc2 ]);

          sc.mergeById( 'foo', { id: 'bar1', a: 11, b: 22 });
          sc2.mergeById('foo', { id: 'bar1', c: 33 });

          return updated;
        }).then(function(){
          expect(  sc.get('foo') ).to.deep.equal( expected );
          expect( sc2.get('foo') ).to.deep.equal( expected );
        });
      });

      it('prevents editing on client2 after client1 locks', function(){
        let caught = false;

        return (
          sc.create()
          .then( () => sc2.load() )
          .then( () => sc.lock() )
          .then( () => sc2.update('foo', 'bar') )
          .catch( () => { caught = true; } )
          .then( () => expect( caught ).to.be.true )
          .then( () => expect( sc.get('foo') ).to.not.equal('bar') )
        );
      });

      it('prevents editing on client1 after client2 locks', function(){
        let caught = false;

        return (
          sc.create()
          .then( () => sc2.load() )
          .then( () => sc2.lock() )
          .then( () => sc.update('foo', 'bar') )
          .catch( () => { caught = true; } )
          .then( () => expect( caught ).to.be.true )
          .then( () => expect( sc2.get('foo') ).to.not.equal('bar') )
        );
      });

      it('client2 gets remotely locked by client1', function(){
        let onRemote = when( sc2, 'remotelock' );
        let onLock = when( sc2, 'lock' );

        return (
          sc.create()
          .then( () => sc2.load() )
          .then( () => sc.lock() )
          .then( () => onRemote )
          .then( () => onLock )
        );
      });

      it('client1 gets remotely locked by client2', function(){
        let onRemote = when( sc, 'remotelock' );
        let onLock = when( sc, 'lock' );

        return (
          sc.create()
          .then( () => sc2.load() )
          .then( () => sc2.lock() )
          .then( () => onRemote )
          .then( () => onLock )
        );
      });

      it('client2 can edit after the syncher is unlocked', function(){
        return (
          sc.create()
          .then( () => sc2.load() )
          .then( () => sc.lock('foo') )
          .then( () => sc.unlock('foo') )
          .then( () => Promise.all([
            sc2.update({ foo: 'bar' }),
            when( sc, 'remoteupdate' )
          ]) )
          .then( () => expect(sc.get('foo')).to.equal('bar') )
        );
      });

      it('client1 can edit after the syncher is unlocked', function(){
        return (
          sc.create()
          .then( () => sc2.load() )
          .then( () => sc2.lock('foo') )
          .then( () => sc2.unlock('foo') )
          .then( () => Promise.all([
            sc.update({ foo: 'bar' }),
            when( sc2, 'remoteupdate' )
          ]) )
          .then( () => expect(sc2.get('foo')).to.equal('bar') )
        );
      });

      it('unlocking with the incorrect key fails', function(){
        let caughtUnlock = false;
        let caughtUpdate = false;

        return (
          sc.create()
          .then( () => sc2.load() )
          .then( () => sc.lock('foo') )
          .then( () => sc2.unlock('bar') )
          .catch( () => caughtUnlock = true )
          .then( () => expect(caughtUnlock).to.be.true )
          .then( () => sc2.update('foo', 'bar') )
          .catch( () => caughtUpdate = true )
          .then( () => expect(caughtUpdate).to.be.true )
        );
      });

      it('getting a remote update with a mismatched hash self corrects', function(){
        return (
          sc.create()
          .then( () => sc2.load() )
          .then( () => sc.get().foo = 'bad data' )
          .then( () => Promise.all([
            sc2.update('bar', 'bar2'),
            when( sc, 'remoteupdate' )
          ]) )
          .then( () => {
            expect( sc.get('foo') ).to.equal('foo');
            expect( sc.get('bar') ).to.equal('bar2');
          } )
        );
      });

      it('getting a remote update with a mismatched hash maintains local ops mid-update', function(){
        // allow retries since there's no guarantee that this test gets the timing correct
        // (race condition: update1 could finish early -- this means the test setup is wrong, not that the model code is broken)
        // (seems to work locally every time)
        this.retries(5);

        let done1 = false;
        let start1 = false;

        let update1 = () => {
          start1 = true;

          sc.update('baz', 'baz2').then( () => done1 = true );
        };

        return (
          sc.create()
          .then( () => sc2.load() )
          .then( () => sc.get().foo = 'bad data' )
          .then( () => {
            setTimeout( update1, 0 );

            return Promise.all([
              sc2.update('bar', 'bar2'),
              when( sc, 'remoteupdate' )
            ]);
          } )
          .then( () => {
            expect( start1, 'client1 update started' ).to.be.true;
            expect( done1, 'client1 update done' ).to.be.false;
            expect( sc.get('foo') ).to.equal('foo');
            expect( sc.get('bar') ).to.equal('bar2');
            expect( sc.get('baz') ).to.equal('baz2');
          } )
        );
      });

      it('getting a remote update with a mismatched hash maintains local ops post-update', function(){
        return (
          sc.create()
          .then( () => sc2.load() )
          .then( () => sc.get().foo = 'bad data' )
          .then( () => {
            return Promise.all([
              sc.update('baz', 'baz2'),
              sc2.update('bar', 'bar2'),
              when( sc, 'remoteupdate' )
            ]);
          } )
          .then( () => {
            expect( sc.get('foo') ).to.equal('foo');
            expect( sc.get('bar') ).to.equal('bar2');
            expect( sc.get('baz') ).to.equal('baz2');
          } )
        );
      });

      it('getting a remote update with a mismatched hash does not affect a different, clean client', function(){
        // sc2 is the clean-hash client

        return (
          sc.create()
          .then( () => sc2.load() )
          .then( () => sc.get().foo = 'bad data' )
          .then( () => {
            return Promise.all([
              sc.update('baz', 'baz2'),
              sc2.update('bar', 'bar2'),
              when( sc, 'remoteupdate' ),
              when( sc2, 'remoteupdate' )
            ]);
          } )
          .then( () => {
            expect( sc.get('foo'), 'client1' ).to.equal('foo');
            expect( sc.get('bar'), 'client1' ).to.equal('bar2');
            expect( sc.get('baz'), 'client1' ).to.equal('baz2');

            expect( sc2.get('foo'), 'client2' ).to.equal('foo');
            expect( sc2.get('bar'), 'client2' ).to.equal('bar2');
            expect( sc2.get('baz'), 'client2' ).to.equal('baz2');
          } )
        );
      });

      it('reloading with mismatched hash corrects the mismatched data', function(){
        return (
          sc.create()
          .then( () => sc.get().foo = 'bad data' )
          .then( () => sc.reload() )
          .then( () => {
            expect( sc.get('foo') ).to.equal('foo');
          } )
        );
      });

      it('reloading with mismatched hash emits the fixes', function( done ){
        sc.on('reload', ( changes, old ) => {
          expect( old.foo ).to.equal('bad data');
          expect( changes.foo ).to.equal('foo');
          expect( Object.keys(changes).length, 'number of changes' ).to.equal(1);

          done();
        });

        (
          sc.create()
          .then( () => sc.get().foo = 'bad data' )
          .then( () => sc.reload() )
        );
      });
    });

  });

});
