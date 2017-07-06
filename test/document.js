let conf = require('./util/conf');

let expect = require('chai').expect;
let Syncher = require('../src/model/syncher');
let ElementFactory = require('../src/model/element/factory');
let Entity = require('../src/model/element/entity');
let Interaction = require('../src/model/element/interaction');
let Protein = require('../src/model/element/protein');
let Document = require('../src/model/document');
let MockSocket = require('./mock/socket');
let ElementCache = require('../src/model/element-cache');
let MockCache = require('./mock/cache');
let TableUtil = require('./util/table');
let io = require('./util/socket-io');
let { whenAll } = require('./util/when');

const NS = 'document_tests';
const NS_ELE = 'document_tests_elements';

describe('Document', function(){
  let doc;
  let intn;
  let ent, ent2;
  let socketEnt = new MockSocket();
  let socketDoc = new MockSocket();
  let tableUtil;
  let tableUtilEle;

  this.timeout( conf.defaultTimeout );

  function describeCommonTests(){
    describe('json', function(){
      it('contains id"', function(){
        expect( doc.json() ).to.have.property('id');
      });

      it('contains elements"', function(){
        expect( doc.json() ).to.have.property('elements');
      });
    });

    it('has an id', function(){
      expect( doc.id() ).to.exist;
    });

    it('adds an element', function(){
      doc.add( ent );

      expect( doc.elements().length ).to.equal(1);
      expect( doc.elements()[0] ).to.equal( ent );
      expect( doc.has( ent ), 'has' ).to.be.true;
    });

    it('adds and removes an element', function(){
      doc.add( ent );

      expect( doc.elements().length ).to.equal(1);
      expect( doc.elements()[0] ).to.equal( ent );
      expect( doc.has( ent ), 'does have' ).to.be.true;

      doc.remove( ent );

      expect( doc.elements().length ).to.equal(0);
      expect( doc.has( ent ), 'does not have' ).to.be.false;
    });

    it('adds an interaction with an element', function(){
      doc.add( ent );
      doc.add( intn );
      intn.add( ent );

      expect( doc.elements().length ).to.equal(2);
      expect( doc.has( ent ), 'doc has ent' ).to.be.true;
      expect( doc.has( intn ), 'doc has intn' ).to.be.true;

      expect( intn.has( ent ), 'intn has ent' ).to.be.true;
    });

    it('removing an interaction keeps the entity', function(){
      doc.add( ent );
      doc.add( intn );
      intn.add( ent );

      doc.remove( intn );

      expect( doc.elements().length ).to.equal(1);
      expect( doc.has( ent ), 'doc has ent' ).to.be.true;
      expect( doc.has( intn ), 'doc has intn' ).to.be.false;

      expect( intn.has( ent ), 'intn has ent' ).to.be.true;
    });
  }

  describe('(client)', function(){
    beforeEach(function(){
      let cache = new MockCache();

      intn = new Interaction({
        socket: socketEnt,
        secret: 'secret',
        cache: cache
      });

      socketEnt.syncher = intn;

      ent = new Entity({
        socket: socketEnt,
        secret: 'secret'
      });

      socketEnt.syncher = ent.syncher;

      doc = new Document({
        socket: socketDoc,
        secret: 'secret',
        cache: cache
      });

      socketDoc.syncher = doc;

      return intn.create().then( () => ent.create() ).then( () => doc.create() );
    });

    describeCommonTests();
  });

  function serverPrePost(){
    before(function( done ){
      tableUtil = new TableUtil( NS );
      tableUtilEle = new TableUtil( NS_ELE );

      tableUtil.clean(function(){
        tableUtil.create(function(){
          tableUtilEle.create(function(){
            done();
          });
        });
      });
    });

    afterEach(function( done ){
      tableUtilEle.deleteEntry( intn.id(), function(){
        tableUtilEle.deleteEntry( ent.id(), function(){
          tableUtil.deleteEntry( doc.id(), function(){
            if( ent2 ){
              tableUtilEle.deleteEntry( ent2.id(), done );
              ent2 = null;
            } else {
              done();
            }
          } );
        } );
      } );
    });

    after(function( done ){
      tableUtil.drop( done ); // only need to drop 1 since all db dropped
    });
  }

  describe('(server)', function(){
    serverPrePost();

    beforeEach(function(){
      let cache = new MockCache();

      intn = new Interaction({
        rethink: tableUtilEle.rethink,
        table: tableUtilEle.table,
        conn: tableUtilEle.conn,
        cache: cache,
        data: {
          secret: 'secret'
        }
      });

      ent = new Entity({
        rethink: tableUtilEle.rethink,
        table: tableUtilEle.table,
        conn: tableUtilEle.conn,
        data: {
          secret: 'secret'
        }
      });

      doc = new Document({
        rethink: tableUtil.rethink,
        table: tableUtil.table,
        conn: tableUtil.conn,
        cache: cache,
        data: {
          secret: 'secret'
        }
      });

      return intn.create().then( () => ent.create() ).then( () => doc.create() );
    });

    describeCommonTests();
  });

  describe('(client-client live synch)', function(){
    serverPrePost();

    //  server client1 client2
    let entS,  entC1,  entC2;  // element
    let ent2S, ent2C1, ent2C2; // element2
    let intnS, intnC1, intnC2; // interaction
    let ftryS, ftryC1, ftryC2; // factory for doc
    let cacheS, cacheC1, cacheC2; // cache for doc
    let docS,  docC1,  docC2;  // doc

    let create = obj => obj.create();
    let load = obj => obj.load();
    let synch = obj => obj.synch( true );
    let unsynch = obj => obj.synch( false );

    before(function(){
      // set up serverside part of synch

      io.start();

      let ioDoc = io.server( NS );
      let ioEle = io.server( NS_ELE );

      Syncher.synch({
        rethink: tableUtil.rethink,
        table: tableUtil.table,
        conn: tableUtil.conn,
        io: ioDoc
      });

      Syncher.synch({
        rethink: tableUtilEle.rethink,
        table: tableUtilEle.table,
        conn: tableUtilEle.conn,
        io: ioEle
      });
    });

    after(function(){
      io.stop();
    });

    beforeEach(function(){
      ent = entS = new Entity({ // server
        rethink: tableUtilEle.rethink,
        table: tableUtilEle.table,
        conn: tableUtilEle.conn,
        data: {
          id: 'ent',
          secret: 'secret',
          liveId: 'entS'
        }
      });

      entC1 = new Entity({ // client 1
        socket: io.client( NS_ELE ),
        data: {
          id: 'ent',
          secret: 'secret',
          liveId: 'entC1'
        }
      });

      entC2 = new Entity({ // client 2
        socket: io.client( NS_ELE ),
        data: {
          id: 'ent',
          secret: 'secret',
          liveId: 'entC2'
        }
      });

      ent2 = ent2S = new Entity({ // server
        rethink: tableUtilEle.rethink,
        table: tableUtilEle.table,
        conn: tableUtilEle.conn,
        data: {
          id: 'ent2',
          secret: 'secret',
          liveId: 'ent2S'
        }
      });

      ent2C1 = new Entity({ // client 1
        socket: io.client( NS_ELE ),
        data: {
          id: 'ent2',
          secret: 'secret',
          liveId: 'ent2C1'
        }
      });

      ent2C2 = new Entity({ // client 2
        socket: io.client( NS_ELE ),
        data: {
          id: 'ent2',
          secret: 'secret',
          liveId: 'ent2C2'
        }
      });

      ftryS = new ElementFactory({
        rethink: tableUtilEle.rethink,
        table: tableUtilEle.table,
        conn: tableUtilEle.conn
      });

      cacheS = new ElementCache({
        factory: ftryS,
        secret: 'secret'
      });

      doc = docS = new Document({ // server
        rethink: tableUtilEle.rethink,
        table: tableUtilEle.table,
        conn: tableUtilEle.conn,
        cache: cacheS,
        data: {
          id: 'doc',
          secret: 'secret',
          liveId: 'docS'
        }
      });

      intn = intnS = new Interaction({ // server
        rethink: tableUtil.rethink,
        table: tableUtil.table,
        conn: tableUtil.conn,
        cache: docS.cache(),
        data: {
          id: 'intn',
          secret: 'secret',
          liveId: 'intnS'
        }
      });

      ftryC1 = new ElementFactory({
        socket: io.client( NS_ELE )
      });

      cacheC1 = new ElementCache({
        factory: ftryC1,
        secret: 'secret'
      });

      docC1 = new Document({ // client 1
        socket: io.client( NS ),
        cache: cacheC1,
        data: {
          id: 'doc',
          secret: 'secret',
          liveId: 'docC1'
        }
      });

      intnC1 = new Interaction({ // client 1
        socket: io.client( NS_ELE ),
        cache: docC1.cache(),
        data: {
          id: 'intn',
          secret: 'secret',
          liveId: 'intnC1'
        }
      });

      ftryC2 = new ElementFactory({
        socket: io.client( NS_ELE )
      });

      cacheC2 = new ElementCache({
        secret: 'secret',
        factory: ftryC2
      });

      docC2 = new Document({
        socket: io.client( NS ),
        cache: cacheC2,
        data: {
          id: 'doc',
          secret: 'secret',
          liveId: 'docC2'
        }
      });

      intnC2 = new Interaction({ // client 2
        socket: io.client( NS_ELE ),
        cache: docC2.cache(),
        data: {
          id: 'intn',
          secret: 'secret',
          liveId: 'intnC2'
        }
      });

      return Promise.resolve().then( () => { // create on client1
        return Promise.all( [ entC1, ent2C1, intnC1, docC1 ].map( create ) );
      } ).then( () => { // load on client2
        return Promise.all( [ entC2, ent2C2, intnC2, docC2 ].map( load ) );
      } ).then( () => {

        [ entS,  ent2S,  intnS  ].forEach( el =>  cacheS.add( el ) );
        [ entC1, ent2C1, intnC1 ].forEach( el => cacheC1.add( el ) );
        [ entC2, ent2C2, intnC2 ].forEach( el => cacheC2.add( el ) );

        return Promise.all( [
          entC1, ent2C1, intnC1, docC1,
          entC2, ent2C2, intnC2, docC2
        ].map( synch ) );
      } );
    });

    afterEach(function(){
      return Promise.all( [
        entC1, ent2C1, intnC1, docC1,
        entC2, ent2C2, intnC2, docC2
      ].map( unsynch ) );
    });

    // basic sanity test
    it('creates on server, loads on client', function(){
      let dS = new Document({ // server
        rethink: tableUtil.rethink,
        table: tableUtil.table,
        conn: tableUtil.conn,
        factory: new ElementFactory(),
        data: {
          id: 'id-int-2',
          secret: 'secret2'
        }
      });

      let dC = new Document({ // client
        socket: io.client( NS ),
        cache: new ElementFactory(),
        data: {
          id: 'id-int-2',
          secret: 'secret2'
        }
      });

      return dS.create().then( () => {
        return dS.update({
          name: 'foobar'
        });
      } ).then( () => {
        return dC.load();
      } ).then( () => {
        expect( dC.name() ).to.equal('foobar');
      } );
    });

    it('initially loads elements for fresh document', function(){
      let ftryC3 = new ElementFactory({
        socket: io.client( NS_ELE )
      });

      let docC3 = new Document({
        socket: io.client( NS ),
        factory: ftryC3,
        data: {
          id: 'doc',
          secret: 'secret',
          liveId: 'docC3'
        }
      });

      return Promise.resolve()
        .then( () => docC1.add( entC1 ) )
        .then( () => docC1.add( ent2C1 ) )
        .then( () => docC3.load() )
        .then( () => {
          //expect( docC3.elements().length ).to.equal( 2 );

          let getIds = ents => ents.map( ent => ent.id() ).sort();

          expect( getIds( docC3.elements() ) ).to.deep.equal( getIds([ entC1, ent2C1 ]) );
        } )
      ;
    });

    it('adds element on client1, resolves on client2', function( done ){
      docC2.on('add', function(){
        expect( docC2.elements().length, 'number of elements' ).to.equal( 1 );
        expect( docC2.elements()[0].id(), 'id' ).to.equal( entC2.id() );
        expect( docC2.elements()[0], 'element' ).to.equal( entC2 );

        done();
      });

      docC1.add( entC1 );
    });

    it('adds element on client2, resolves on client1', function( done ){
      docC1.on('add', function(){
        expect( docC1.elements().length, 'number of elements' ).to.equal( 1 );
        expect( docC1.elements()[0].id(), 'pid' ).to.equal( entC1.id() );
        expect( docC1.elements()[0], 'element' ).to.equal( entC1 );

        done();
      });

      docC2.add( entC2 );
    });

    it('adds and removes element on client1, resolves on client2', function( done ){
      docC2.on('add', function(){
        expect( docC2.elements().length, 'number of elements (add)' ).to.equal( 1 );
        expect( docC2.elements()[0].id(), 'pid' ).to.equal( entC2.id() );
        expect( docC2.elements()[0], 'element' ).to.equal( entC2 );

        docC1.remove( entC1 );
      });

      docC2.on('remove', function(){
        expect( docC2.elements().length, 'number of elements (rem)' ).to.equal( 0 );

        done();
      });

      docC1.add( entC1 );
    });

    it('adds and removes (by id) element on client1, resolves on client2', function( done ){
      docC2.on('add', function(){
        expect( docC2.elements().length, 'number of elements (add)' ).to.equal( 1 );
        expect( docC2.elements()[0].id(), 'pid' ).to.equal( entC2.id() );
        expect( docC2.elements()[0], 'element' ).to.equal( entC2 );

        docC1.remove( entC1.id() );
      });

      docC2.on('remove', function(){
        expect( docC2.elements().length, 'number of elements (rem)' ).to.equal( 0 );

        done();
      });

      docC1.add( entC1 );
    });

    it('adds element on client1, removes element on client2, resolves on both', function( done ){
      docC2.on('add', function(){
        expect( docC2.elements().length, 'number of elements (client2)' ).to.equal( 1 );
        expect( docC2.elements()[0].id(), 'pid' ).to.equal( entC2.id() );
        expect( docC2.elements()[0], 'element' ).to.equal( entC2 );

        docC2.remove( entC2 );
      });

      docC1.on('remove', function(){
        expect( docC1.elements().length, 'number of elements (client1)' ).to.equal( 0 );
        expect( docC2.elements().length, 'number of elements (client2)' ).to.equal( 0 );

        done();
      });

      docC1.add( entC1 );
    });

    it('removes element on client1, adds element on client2, resolves on both', function( done ){
      docC1.on('add', function(){
        expect( docC1.elements().length, 'number of elements (client1)' ).to.equal( 1 );
        expect( docC1.elements()[0].id(), 'pid' ).to.equal( entC1.id() );
        expect( docC1.elements()[0], 'element' ).to.equal( entC1 );

        docC1.remove( entC1 );
      });

      docC2.on('remove', function(){
        expect( docC1.elements().length, 'number of elements (client1)' ).to.equal( 0 );
        expect( docC2.elements().length, 'number of elements (client2)' ).to.equal( 0 );

        done();
      });

      docC2.add( entC2 );
    });

    it('adds element on both clients simultaneously', function(){
      return Promise.resolve().then( () => {
        let updated = whenAll( [ docC1, docC2 ], 'add', 2 );

        docC1.on('remove', () => {
          throw new Error(`docC1 should not have anything removed`);
        });

        docC2.on('remove', () => {
          throw new Error(`docC2 should not have anything removed`);
        });

        docC1.add( entC1 );
        docC2.add( ent2C2 );

        return updated;
      } ).then( () => {
        expect( docC1.elements().length, 'number of elements (client1)' ).to.equal( 2 );
        expect( docC2.elements().length, 'number of elements (client2)' ).to.equal( 2 );

        let ids = intn => intn.elements().map( ele => ele.id() ).sort();
        let expectedIds = [ entC1.id(), ent2C2.id() ].sort();

        expect( ids( docC1 ), 'client1 ids' ).to.deep.equal( expectedIds );
        expect( ids( docC2 ), 'client2 ids' ).to.deep.equal( expectedIds );
      } );
    });

    it('removes element on both clients simultaneously', function(){
      return Promise.resolve().then( () => {
        let updated = whenAll( [ docC1, docC2 ], 'add', 2 );

        docC1.add( entC1 );
        docC2.add( ent2C2 );

        return updated;
      } ).then( () => {
        let updated = whenAll( [ docC1, docC2 ], 'remove', 2 );

        docC1.on('add', () => {
          throw new Error(`docC1 should not have anything added`);
        });

        docC2.on('add', () => {
          throw new Error(`docC2 should not have anything added`);
        });

        docC1.remove( entC1 );
        docC2.remove( ent2C2 );

        return updated;
      } ).then( () => {
        expect( docC1.elements().length, 'number of elements (client1)' ).to.equal( 0 );
        expect( docC2.elements().length, 'number of elements (client2)' ).to.equal( 0 );
      } );
    });

    it('associates entity on client1, resolves on client2', function( next ){
      let assoc = {
        name: 'p53',
        id: 43289543859,
        organism: 9606,
        type: 'protein'
      };

      let replaced = [ true, false, false ]; // index 0 is nothing

      let replace = i => {
        replaced[i] = true;
        checkDone();
      };

      let associated = [ true, false, false ]; // index 0 is nothing

      let associate = i => {
        associated[i] = true;
        checkDone();
      };

      let checkDone = () => {
        let isDone = arr => !arr.some( val => !val );

        if( isDone( associated ) && isDone( replaced ) ){
          next();
        }
      };

      entC1.on('associated', () => associate(1));

      docC1.on('replace', function( oldEnt, newEnt ){
        expect( oldEnt, 'old ent 1' ).to.equal( entC1 );
        expect( newEnt instanceof Protein, 'new ent 1 is protein' ).to.be.true;
        expect( newEnt.name(), 'new name 1' ).to.equal('p53');

        replace(1);
      });

      entC2.on('associated', () => associate(2));

      docC2.on('replace', function( oldEnt, newEnt ){
        expect( oldEnt, 'old ent 2' ).to.equal( entC2 );
        expect( newEnt instanceof Protein, 'new ent 2 is protein' ).to.be.true;
        expect( newEnt.name(), 'new name 2' ).to.equal('p53');

        replace(2);
      });

      Promise.all([
        docC1.add( entC1 ),
        docC2.add( entC2 )
      ]).then( () => {
        entC1.associate( assoc );

        expect( entC1.association(), 'association' ).to.deep.equal( assoc );
      });
    });
  });
});
