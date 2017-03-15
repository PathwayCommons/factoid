let conf = require('./util/conf');

let expect = require('chai').expect;
let Syncher = require('../src/model/syncher');
let ElementFactory = require('../src/model/element/factory');
let Entity = require('../src/model/element/entity');
let Interaction = require('../src/model/element/interaction');
let _ = require('lodash');
let MockSocket = require('./mock/socket');
let MockCache = require('./mock/cache');
let TableUtil = require('./util/table');
let io = require('./util/socket-io');
let { when, whenAll } = require('./util/when');

const NS = 'interaction_tests';
const NS_ENT = 'interaction_tests';

describe('Interaction', function(){
  let intn;
  let ent;
  let socket = new MockSocket();
  let socketEnt = new MockSocket();
  let tableUtil;
  let tableUtilEnt;

  this.timeout( conf.defaultTimeout );

  function describeCommonTests(){
    describe('type', function(){
      it('is "interaction"', function(){
        expect( intn.type() ).to.equal('interaction');
      });

      it('isInteraction', function(){
        expect( intn.isInteraction() ).to.be.true;
      });
    });

    describe('json', function(){
      it('contains type:"interaction"', function(){
        expect( intn.json() ).to.have.property('type', 'interaction');
      });
    });

    it('adds an element', function(){
      intn.add( ent );

      expect( intn.participants().length ).to.equal(1);
      expect( intn.participants()[0] ).to.equal( ent );
      expect( intn.has( ent ), 'has' ).to.be.true;
    });

    it('adds and removes an element', function(){
      intn.add( ent );

      expect( intn.participants().length ).to.equal(1);
      expect( intn.participants()[0] ).to.equal( ent );
      expect( intn.has( ent ), 'does have' ).to.be.true;

      intn.remove( ent );

      expect( intn.participants().length ).to.equal(0);
      expect( intn.has( ent ), 'does not have' ).to.be.false;
    });
  }

  describe('(client)', function(){
    beforeEach(function(){
      intn = new Interaction({
        socket: socket,
        cache: new MockCache(),
        data: {
          secret: 'secret'
        }
      });

      socket.syncher = intn;

      ent = new Entity({
        socket: socketEnt,
        data: {
          secret: 'secret'
        }
      });

      socketEnt.syncher = ent.syncher;

      return intn.create().then( () => ent.create() );
    });

    describeCommonTests();
  });

  function serverPrePost(){
    before(function( done ){
      tableUtil = new TableUtil( NS );
      tableUtilEnt = NS === NS_ENT ? tableUtil : new TableUtil( NS_ENT );

      tableUtil.clean(function(){
        tableUtil.create(function(){
          if( NS === NS_ENT ){
            done();
          } else {
            tableUtilEnt.create( done );
          }
        });
      });
    });

    afterEach(function( done ){
      tableUtil.deleteEntry( intn.id(), function(){
        tableUtilEnt.deleteEntry( ent.id(), done );
      } );
    });

    after(function( done ){
      tableUtil.drop( done ); // only need to drop 1 since all db dropped
    });
  }

  describe('(server)', function(){
    serverPrePost();

    beforeEach(function(){
      intn = new Interaction({
        rethink: tableUtil.rethink,
        table: tableUtil.table,
        conn: tableUtil.conn,
        cache: new MockCache(),
        data: {
          secret: 'secret'
        }
      });

      ent = new Entity({
        rethink: tableUtilEnt.rethink,
        table: tableUtilEnt.table,
        conn: tableUtilEnt.conn,
        data: {
          secret: 'secret'
        }
      });

      return intn.create().then( () => ent.create() );
    });

    describeCommonTests();
  });

  describe('(client-client live synch)', function(){
    serverPrePost();

    //  server client1 client2
    let entS,  entC1,  entC2;  // element
    let ent2S, ent2C1, ent2C2;  // element2
    let intnS, intnC1, intnC2; // interaction
    let cacheS, cacheC1, cacheC2; // cache for interactions

    let create = obj => obj.create();
    let load = obj => obj.load();
    let synch = obj => obj.synch( true );
    let unsynch = obj => obj.synch( false );

    before(function(){
      // set up serverside part of synch
      Syncher.synch({
        rethink: tableUtil.rethink,
        table: tableUtil.table,
        conn: tableUtil.conn,
        io: io.server( NS )
      });

      if( NS !== NS_ENT ){
        Syncher.synch({
          rethink: tableUtilEnt.rethink,
          table: tableUtilEnt.table,
          conn: tableUtilEnt.conn,
          io: io.server( NS_ENT )
        });
      }
    });

    beforeEach(function(){
      ent = entS = new Entity({ // server
        rethink: tableUtilEnt.rethink,
        table: tableUtilEnt.table,
        conn: tableUtilEnt.conn,
        data: {
          id: 'ent',
          secret: 'secret',
          liveId: 'entS'
        }
      });

      entC1 = new Entity({ // client 1
        socket: io.client( NS_ENT ),
        data: {
          id: 'ent',
          secret: 'secret',
          liveId: 'entC1'
        }
      });

      entC2 = new Entity({ // client 2
        socket: io.client( NS_ENT ),
        data: {
          id: 'ent',
          secret: 'secret',
          liveId: 'entC2'
        }
      });

      ent2S = new Entity({ // server
        rethink: tableUtilEnt.rethink,
        table: tableUtilEnt.table,
        conn: tableUtilEnt.conn,
        data: {
          id: 'ent2',
          secret: 'secret',
          liveId: 'ent2S'
        }
      });

      ent2C1 = new Entity({ // client 1
        socket: io.client( NS_ENT ),
        data: {
          id: 'ent2',
          secret: 'secret',
          liveId: 'ent2C1'
        }
      });

      ent2C2 = new Entity({ // client 2
        socket: io.client( NS_ENT ),
        data: {
          id: 'ent2',
          secret: 'secret',
          liveId: 'ent2C2'
        }
      });

      cacheS = new MockCache({
        secret: 'secret',
        factory: new ElementFactory({
          rethink: tableUtilEnt.rethink,
          table: tableUtilEnt.table,
          conn: tableUtilEnt.conn
        })
      });

      intn = intnS = new Interaction({ // server
        rethink: tableUtil.rethink,
        table: tableUtil.table,
        conn: tableUtil.conn,
        cache: cacheS,
        data: {
          id: 'intn',
          secret: 'secret',
          liveId: 'intnS'
        }
      });

      cacheC1 = new MockCache({
        secret: 'secret',
        factory: new ElementFactory({
          socket: io.client( NS_ENT )
        })
      });

      intnC1 = new Interaction({ // client 1
        socket: io.client( NS ),
        cache: cacheC1,
        data: {
          id: 'intn',
          secret: 'secret',
          liveId: 'intnC1'
        }
      });

      cacheC2 = new MockCache({
        secret: 'secret',
        factory: new ElementFactory({
          socket: io.client( NS_ENT )
        })
      });

      intnC2 = new Interaction({ // client 2
        socket: io.client( NS ),
        cache: cacheC2,
        data: {
          id: 'intn',
          secret: 'secret',
          liveId: 'intnC2'
        }
      });

      return Promise.resolve().then( () => { // create on client1
        return Promise.all( [ entC1, ent2C1, intnC1 ].map( create ) );
      } ).then( () => { // load on client2
        return Promise.all( [ entC2, ent2C2, intnC2 ].map( load ) );
      } ).then( () => {

        [ entS,  ent2S,  intnS  ].forEach( el =>  cacheS.add( el ) );
        [ entC1, ent2C1, intnC1 ].forEach( el => cacheC1.add( el ) );
        [ entC2, ent2C2, intnC2 ].forEach( el => cacheC2.add( el ) );

        return Promise.all( [
          entC1, ent2C1, intnC1,
          entC2, ent2C2, intnC2
        ].map( synch ) );
      } );
    });

    afterEach(function(){
      return Promise.all( [
        entC1, ent2C1, intnC1,
        entC2, ent2C2, intnC2
      ].map( unsynch ) );
    });

    // basic sanity test
    it('creates on server, loads on client', function(){
      let eleS = new Interaction({ // server
        rethink: tableUtil.rethink,
        table: tableUtil.table,
        conn: tableUtil.conn,
        cache: new MockCache(),
        data: {
          id: 'id-int-2',
          secret: 'secret2'
        }
      });

      let eleC = new Interaction({ // client
        socket: io.client( NS ),
        cache: new MockCache(),
        data: {
          id: 'id-int-2',
          secret: 'secret2'
        }
      });

      return eleS.create().then( () => {
        return eleS.update({
          position: { x: 12, y: 34 },
          name: 'foobar'
        });
      } ).then( () => {
        return eleC.load();
      } ).then( () => {
        expect( eleC.position() ).to.deep.equal({ x: 12, y: 34 });
        expect( eleC.name() ).to.equal('foobar');
      } );
    });

    it('initially loads participants for fresh interaction', function(){
      let cacheC3 = new MockCache({
        secret: 'secret',
        factory: new ElementFactory({
          socket: io.client( NS_ENT )
        })
      });

      let intnC3 = new Interaction({ // client 2
        socket: io.client( NS ),
        cache: cacheC3,
        data: {
          id: 'intn',
          secret: 'secret',
          liveId: 'intnC3'
        }
      });

      return Promise.resolve()
        .then( () => intnC1.add( entC1 ) )
        .then( () => intnC1.add( ent2C1 ) )
        .then( () => intnC3.load() )
        .then( () => {
          expect( intnC3.participants().length ).to.equal( 2 );

          let getIds = ents => ents.map( ent => ent.id() ).sort();

          expect( getIds( intnC3.participants() ) ).to.deep.equal( getIds([ entC1, ent2C1 ]) );
        } )
      ;
    });

    it('adds participant on client1, resolves on client2', function( done ){
      intnC2.on('add', function(){
        expect( intnC2.participants().length, 'number of participants' ).to.equal( 1 );
        expect( intnC2.participants()[0].id(), 'pid' ).to.equal( entC2.id() );
        expect( intnC2.participants()[0], 'participant' ).to.equal( entC2 );

        done();
      });

      intnC1.add( entC1 );
    });

    it('adds participant on client2, resolves on client1', function( done ){
      intnC1.on('add', function(){
        expect( intnC1.participants().length, 'number of participants' ).to.equal( 1 );
        expect( intnC1.participants()[0].id(), 'pid' ).to.equal( entC1.id() );
        expect( intnC1.participants()[0], 'participant' ).to.equal( entC1 );

        done();
      });

      intnC2.add( entC2 );
    });

    it('adds and removes participant on client1, resolves on client2', function( done ){
      intnC2.on('add', function(){
        expect( intnC2.participants().length, 'number of participants (add)' ).to.equal( 1 );
        expect( intnC2.participants()[0].id(), 'pid' ).to.equal( entC2.id() );
        expect( intnC2.participants()[0], 'participant' ).to.equal( entC2 );

        intnC1.remove( entC1 );
      });

      intnC2.on('remove', function(){
        expect( intnC2.participants().length, 'number of participants (rem)' ).to.equal( 0 );

        done();
      });

      intnC1.add( entC1 );
    });

    it('adds and removes (by id) participant on client1, resolves on client2', function( done ){
      intnC2.on('add', function(){
        expect( intnC2.participants().length, 'number of participants (add)' ).to.equal( 1 );
        expect( intnC2.participants()[0].id(), 'pid' ).to.equal( entC2.id() );
        expect( intnC2.participants()[0], 'participant' ).to.equal( entC2 );

        intnC1.remove( entC1.id() );
      });

      intnC2.on('remove', function(){
        expect( intnC2.participants().length, 'number of participants (rem)' ).to.equal( 0 );

        done();
      });

      intnC1.add( entC1 );
    });

    it('adds participant on client1, removes participant on client2, resolves on both', function( done ){
      intnC2.on('add', function(){
        expect( intnC2.participants().length, 'number of participants (client2)' ).to.equal( 1 );
        expect( intnC2.participants()[0].id(), 'pid' ).to.equal( entC2.id() );
        expect( intnC2.participants()[0], 'participant' ).to.equal( entC2 );

        intnC2.remove( entC2 );
      });

      intnC1.on('remove', function(){
        expect( intnC1.participants().length, 'number of participants (client1)' ).to.equal( 0 );
        expect( intnC2.participants().length, 'number of participants (client2)' ).to.equal( 0 );

        done();
      });

      intnC1.add( entC1 );
    });

    it('removes participant on client1, adds participant on client2, resolves on both', function(){
      return Promise.resolve().then( () => {
        let onAdd = when( intnC1, 'add' );

        intnC2.add( entC2 );

        return onAdd.then(function(){
          expect( intnC1.participants().length, 'number of participants (client1)' ).to.equal( 1 );
          expect( intnC1.participants()[0].id(), 'pid' ).to.equal( entC1.id() );
          expect( intnC1.participants()[0], 'participant' ).to.equal( entC1 );
        });
      } ).then( () => {
        let onRm = when( intnC2, 'remove' );

        intnC1.remove( entC1 );

        return onRm.then(function(){
          expect( intnC1.participants().length, 'number of participants (client1)' ).to.equal( 0 );
          expect( intnC2.participants().length, 'number of participants (client2)' ).to.equal( 0 );
        });
      } );
    });

    it('adds participant on both clients simultaneously', function(){
      return Promise.resolve().then( () => {
        let updated = whenAll( [ intnC1, intnC2 ], 'add', 2 );

        intnC1.on('remove', ( ele, group ) => {
          throw new Error(`intnC1 should not have anything removed`);
        });

        intnC2.on('remove', ( ele, group ) => {
          throw new Error(`intnC2 should not have anything removed`);
        });

        intnC1.add( entC1 );
        intnC2.add( ent2C2 );

        return updated;
      } ).then( () => {
        expect( intnC1.participants().length, 'number of participants (client1)' ).to.equal( 2 );
        expect( intnC2.participants().length, 'number of participants (client2)' ).to.equal( 2 );

        let ids = intn => intn.participants().map( ele => ele.id() ).sort();
        let expectedIds = [ entC1.id(), ent2C2.id() ].sort();

        expect( ids( intnC1 ), 'client1 ids' ).to.deep.equal( expectedIds );
        expect( ids( intnC2 ), 'client2 ids' ).to.deep.equal( expectedIds );
      } );
    });

    it('removes participant on both clients simultaneously', function(){
      return Promise.resolve().then( () => {
        let updated = whenAll( [ intnC1, intnC2 ], 'add', 2 );

        intnC1.add( entC1 );
        intnC2.add( ent2C2 );

        return updated;
      } ).then( () => {
        let updated = whenAll( [ intnC1, intnC2 ], 'remove', 2 );

        intnC1.on('add', ( ele, group ) => {
          throw new Error(`intnC1 should not have anything added`);
        });

        intnC2.on('add', ( ele, group ) => {
          throw new Error(`intnC2 should not have anything added`);
        });

        intnC1.remove( entC1 );
        intnC2.remove( ent2C2 );

        return updated;
      } ).then( () => {
        expect( intnC1.participants().length, 'number of participants (client1)' ).to.equal( 0 );
        expect( intnC2.participants().length, 'number of participants (client2)' ).to.equal( 0 );
      } );
    });

  });
});
