let conf = require('./util/conf');

let expect = require('chai').expect;
let Syncher = require('../src/model/syncher');
let Element = require('../src/model/element/element');
let _ = require('lodash');
let MockSocket = require('./mock/socket');
let TableUtil = require('./util/table');
let io = require('./util/socket-io');

const NS = 'element_tests';

describe('Element', function(){
  let ele;
  let socket = new MockSocket();
  let tableUtil;

  this.timeout( conf.defaultTimeout );

  function describeCommonTests(){
    describe('name', function(){
      it('exists', function(){
        expect( ele.name() ).to.exist;
        expect( ele.name() ).to.be.a('string');
      });

      it('can be changed', function(){
        ele.rename('foo');

        expect( ele.name() ).to.equal('foo');
      });

      it('emits rename event when changed', function( done ){
        ele.on( 'rename', () => done() );

        ele.rename('foo');
      });
    });

    describe('type', function(){
      it('is "element"', function(){
        expect( ele.type() ).to.equal('element');
      });

      it('is not entity', function(){
        expect( ele.isEntity() ).to.be.false;
      });

      it('is not interaction', function(){
        expect( ele.isInteraction() ).to.be.false;
      });
    });

    describe('position', function(){
      it('exists', function(){
        expect( ele.position() ).to.exist;
        expect( ele.position() ).to.be.an('object');
      });

      it('has (x, y) numbers', function(){
        expect( ele.position() ).to.have.property('x');
        expect( ele.position() ).to.have.property('y');

        expect( ele.position().x ).to.be.a('number');
        expect( ele.position().y ).to.be.a('number');
      });

      it('can be changed', function(){
        let newPos = { x: 1, y: 2 };

        ele.reposition( newPos );

        expect( ele.position() ).to.deep.equal( newPos );
      });

      it('emits a reposition event when changed', function(){
        let triggers = 0;

        ele.on( 'reposition', () => triggers++ );

        return ele.reposition({ x: 2, y: 3 }).then( () => {
          expect( triggers ).to.equal(1);
        } );
      });
    });
  }

  describe('(client)', function(){
    beforeEach(function(){

      ele = new Element({
        socket
      });

      socket.syncher = ele.syncher;

      return ele.create();
    });

    describeCommonTests();
  });

  function serverPrePost(){
    before(function( done ){
      tableUtil = new TableUtil( NS );

      tableUtil.clean(function(){
        tableUtil.create( done );
      });
    });

    afterEach(function( done ){
      tableUtil.deleteEntry( ele.id(), done );
    });

    after(function( done ){
      tableUtil.drop( done );
    });
  }

  describe('(server)', function(){
    serverPrePost();

    beforeEach(function(){
      ele = new Element({
        rethink: tableUtil.rethink,
        table: tableUtil.table,
        conn: tableUtil.conn,
        data: {
          secret: 'secret',
          name: 'foo',
          position: { x: 1, y: 2 }
        }
      });

      return ele.create();
    });

    describeCommonTests();
  });

  describe('(client-client live synch)', function(){
    serverPrePost();

    let eleS, eleC1, eleC2;

    before(function(){
      // set up serverside part of synch
      Syncher.synch({
        rethink: tableUtil.rethink,
        table: tableUtil.table,
        conn: tableUtil.conn,
        io: io.server( NS )
      });
    });

    beforeEach(function( done ){
      ele = eleS = new Element({ // server
        rethink: tableUtil.rethink,
        table: tableUtil.table,
        conn: tableUtil.conn,
        data: {
          id: 'id',
          secret: 'secret'
        }
      });

      eleC1 = new Element({ // client 1
        socket: io.client( NS ),
        data: {
          id: 'id',
          secret: 'secret'
        }
      });

      eleC2 = new Element({ // client 2
        socket: io.client( NS ),
        data: {
          id: 'id',
          secret: 'secret'
        }
      });

      eleC1.create().then(function(){
        return eleC2.load();
      }).then(function(){
        return Promise.all([
          eleC1.synch( true ),
          eleC2.synch( true )
        ]);
      }).then( () => done() );
    });

    afterEach(function(){
      return Promise.all([
        eleC1.synch( false ),
        eleC2.synch( false )
      ]);
    });

    // basic sanity test
    it('creates on server, loads on client', function(){
      let eleS = new Element({ // server
        rethink: tableUtil.rethink,
        table: tableUtil.table,
        conn: tableUtil.conn,
        data: {
          id: 'id2',
          secret: 'secret'
        }
      });

      let eleC = new Element({ // client
        socket: io.client( NS ),
        data: {
          id: 'id2',
          secret: 'secret'
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

    it('repositions on client1, heard by client2', function( done ){
      let renamed = false;

      let finish = () => { // make sure only the diffed prop event gets triggered
        expect( renamed, 'renamed' ).to.be.false;

        done();
      };

      eleC2.on('rename', function(){
        renamed = true;
      });

      eleC2.on('reposition', function(){
        expect( eleC2.position() ).to.deep.equal({ x: 222, y: 222 });

        setTimeout( finish, 500 );
      });

      eleC1.reposition({ x: 222, y: 222 });
    });

    it('renames on client1, heard by client2', function( done ){
      let repositioned = false;

      let finish = () => { // make sure only the diffed prop event gets triggered
        expect( repositioned, 'repositioned' ).to.be.false;

        done();
      };

      eleC2.on('reposition', function( newpos ){
        repositioned = true;
      });

      eleC2.on('rename', function(){
        expect( eleC2.name() ).to.equal('newname');

        setTimeout( finish, 500 );
      });

      eleC1.rename('newname');
    });
  });
});
