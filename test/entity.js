require('./util/conf');

let expect = require('chai').expect;
let Syncher = require('../src/model/syncher');
let Entity = require('../src/model/element/entity');
let _ = require('lodash');
let MockSocket = require('./mock/socket');
let TableUtil = require('./util/table');
let io = require('./util/socket-io');

const NS = 'entity_tests';

describe('Entity', function(){
  let ele;
  let socket = new MockSocket();
  let tableUtil;

  function describeCommonTests(){
    describe('type', function(){
      it('is "entity"', function(){
        expect( ele.type() ).to.equal('entity');
      });

      it('isEntity', function(){
        expect( ele.isEntity() ).to.be.true;
      });
    });

    describe('json', function(){
      it('contains type:"entity"', function(){
        expect( ele.json() ).to.have.property('type', 'entity');
      });
    });
  }

  describe('(client)', function(){
    beforeEach(function(){
      ele = new Entity({
        socket,
        data: {
          secret: 'secret'
        }
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
      ele = new Entity({
        rethink: tableUtil.rethink,
        table: tableUtil.table,
        conn: tableUtil.conn,
        data: {
          secret: 'secret'
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
    })

    beforeEach(function( done ){
      ele = eleS = new Entity({ // server
        rethink: tableUtil.rethink,
        table: tableUtil.table,
        conn: tableUtil.conn,
        data: {
          id: 'id',
          secret: 'secret'
        }
      });

      eleC1 = new Entity({ // client 1
        socket: io.client( NS ),
        data: {
          id: 'id',
          secret: 'secret'
        }
      });

      eleC2 = new Entity({ // client 2
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
      let eleS = new Entity({ // server
        rethink: tableUtil.rethink,
        table: tableUtil.table,
        conn: tableUtil.conn,
        data: {
          id: 'id2',
          secret: 'secret'
        }
      });

      let eleC = new Entity({ // client
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
      eleC2.on('reposition', function(){
        expect( eleC2.position() ).to.deep.equal({ x: 222, y: 222 });

        done();
      });

      eleC1.reposition({ x: 222, y: 222 });
    });

    it('renames on client1, heard by client2', function( done ){
      eleC2.on('rename', function(){
        expect( eleC2.name() ).to.equal('newname');

        done();
      });

      eleC1.rename('newname');
    });
  });
});
