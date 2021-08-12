import * as conf from './util/conf';

import { expect } from 'chai';
import Syncher from '../src/model/syncher';
import Entity from '../src/model/element/entity';
import MockSocket from './mock/socket';
import TableUtil from './util/table';
import * as io from './util/socket-io';

const NS = 'entity_tests';

const TEST_GROUND_GGP = {
  "namespace": "ncbi",
  "type": "ggp",
  "dbName": "NCBI Gene",
  "dbPrefix": "ncbigene",
  "id": "6187",
  "organism": "9606",
  "organismName": "Homo sapiens",
  "name": "RPS2",
  "synonyms": [
    "LLREP3",
    "S2",
    "40S ribosomal protein S2",
    "40S ribosomal protein S4",
    "OK/KNS-cl.6",
    "protein LLRep3",
    "small ribosomal subunit protein uS5",
    "ribosomal protein S2"
  ],
  "dbXrefs": [
    {
      "db": "MIM",
      "id": "603624"
    },
    {
      "db": "HGNC",
      "id": "HGNC:10404"
    },
    {
      "db": "Ensembl",
      "id": "ENSG00000140988"
    }
  ],
  "typeOfGene": "protein-coding",
  "esScore": 11.818938,
  "defaultOrganismIndex": 2,
  "organismIndex": 2,
  "combinedOrganismIndex": 2,
  "distance": 0,
  "nameDistance": 0,
  "overallDistance": 200000
};

const TEST_GROUND_CHEMICAL = {
  "namespace": "chebi",
  "type": "chemical",
  "dbName": "ChEBI",
  "dbPrefix": "CHEBI",
  "id": "73694",
  "name": "Trp-Ser",
  "inchi": "InChI=1S/C14H17N3O4/c15-10(13(19)17-12(7-18)14(20)21)5-8-6-16-11-4-2-1-3-9(8)11/h1-4,6,10,12,16,18H,5,7,15H2,(H,17,19)(H,20,21)/t10-,12-/m0/s1",
  "inchiKey": "MYVYPSWUSKCCHG-JQWIXIFHSA-N",
  "synonyms": [
    "L-Trp-L-Ser",
    "W-S",
    "WS",
    "tryptophylserine",
    "L-tryptophyl-L-serine"
  ],
  "charge": 0,
  "mass": 291.3025,
  "monoisotopicMass": 291.12191,
  "formulae": [
    "C14H17N3O4"
  ],
  "summary": "A dipeptide formed from L-tryptophan and L-serine residues.",
  "esScore": 1.4385332,
  "defaultOrganismIndex": 0,
  "organismIndex": 0,
  "combinedOrganismIndex": 0,
  "distance": 0.6,
  "nameDistance": 0.6,
  "overallDistance": 6000000060
};

describe('Entity', function(){
  let ele;
  let socket = new MockSocket();
  let tableUtil;

  this.timeout( conf.defaultTimeout );

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

    let eleS, eleC1, eleC2; // eslint-disable-line

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

    it('associates with grounding', function( done ){
      eleC2.on('associate', function(){
        expect( eleC2.association().foo ).to.equal('bar');

        done();
      });

      eleC1.associate({
        foo: 'bar'
      });
    });

    it('associates with grounding x2 on self client', function( done ){
      eleC1.associate( TEST_GROUND_GGP );

      eleC1.associate( TEST_GROUND_CHEMICAL );

      // old grounding should be gone from client 1
      expect( eleC1.association().organism ).to.not.exist;

      // new grounding should be there for client 1
      expect( eleC1.association().monoisotopicMass ).to.equal( TEST_GROUND_CHEMICAL.monoisotopicMass );

      done();
    });

    it('associates with grounding x2 on server', function( done ){
      const test = async function() {
        await eleC1.associate( TEST_GROUND_GGP );

        await eleC1.associate( TEST_GROUND_CHEMICAL );

        let eleS1 = new Entity({ // server
          rethink: tableUtil.rethink,
          table: tableUtil.table,
          conn: tableUtil.conn,
          data: {
            id: 'id',
            secret: 'secret'
          }
        });

        await eleS1.load();

        // old grounding should be gone from client 1
        expect( eleS1.association().organism ).to.not.exist;

        // new grounding should be there for client 1
        expect( eleS1.association().monoisotopicMass ).to.equal( TEST_GROUND_CHEMICAL.monoisotopicMass );

        done();
      };

      test();
    });

    it('associates with grounding x2 on remote client', function( done ){
      const test = async function() {
        let i = 0;

        eleC2.on('associate', function() {
          i++;

          if (i === 1) {
            // first grounding should be in client 2
            expect( eleC2.association().organism ).to.equal( TEST_GROUND_GGP.organism );
          } else {
            // old grounding should be gone from client 2
            expect( eleC2.association().organism ).to.not.exist;

            // new grounding should be there for client 2
            expect( eleC2.association().monoisotopicMass ).to.equal( TEST_GROUND_CHEMICAL.monoisotopicMass );

            done();
          }
        });

        await eleC1.associate( TEST_GROUND_GGP );

        await eleC1.associate( TEST_GROUND_CHEMICAL );
      };

      test();
    });
  });
});
