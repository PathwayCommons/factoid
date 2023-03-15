import { expect } from 'chai';
import rdbFix from 'rethinkdb-fixtures';
import r from 'rethinkdb';
import _ from 'lodash';

import { loadDoc } from '../src/server/routes/api/document/index.js';
import { initDriver, closeDriver } from '../src/neo4j/neo4j-driver.js';
import { searchByGeneId, getInteractions, getNeighbouringNodes } from '../src/neo4j/neo4j-functions.js';
import { addDocumentToNeo4j } from '../src/neo4j/neo4j-document.js';
import { deleteAllNodesAndEdges } from '../src/neo4j/test-functions.js';

import goult1 from './doct_tests_1.json';
import goult2 from './doct_tests_2.json';
import goult3 from './doct_tests_3.json';
import goult4 from './doct_tests_4.json';
import goult5 from './doct_tests_5.json';

let rdbConn;
let dbFix;
let testDb;
const dbName = 'factoid-neo4j-test';
const dbTables = ['document', 'element'];

describe('04. Tests for searchByGeneId', function () {

  before('Create a Neo4j driver instance and connect to server. Connect to RDB', async function () {
    await initDriver();

    rdbConn = await r.connect({ host: 'localhost', db: dbName });
    const exists = await r.dbList().contains(dbName).run(rdbConn);
    if (!exists) {
      await r.dbCreate(dbName).run(rdbConn);
    }
    testDb = r.db(dbName);
    dbFix = rdbFix({
      db: dbName,
      clear: true
    });
  });

  before('Wipe Neo4j database. Then add all 5 test docs to Neo4j', async function () {
    await deleteAllNodesAndEdges();

    let loadTable = name => ({ rethink: r, conn: rdbConn, db: testDb, table: testDb.table(name) });
    let loadTables = () => Promise.all(dbTables.map(loadTable)).then(dbInfos => ({ docDb: dbInfos[0], eleDb: dbInfos[1] }));

    let docs = [goult1, goult2, goult3, goult4, goult5];

    for (const goultDoc of docs) {
      const { document } = await dbFix.Insert(goultDoc);
      const { docDb, eleDb } = await loadTables();
      const loadDocs = ({ id, secret }) => loadDoc({ docDb, eleDb, id, secret });
      let fixtureDocs = await Promise.all(document.map(loadDocs));

      let myDoc = fixtureDocs[0];
      await addDocumentToNeo4j(myDoc);
    }
  });

  after('Wipe RDB. Close Neo4j driver and RDB connection.', async function () {
    await dbFix.Delete(dbTables);
    await closeDriver();
    await rdbConn.close();
  });

  it('Search for MAPK6', async function () {
    let mapk6 = 'ncbigene:5597';
    expect(await searchByGeneId(mapk6)).to.be.null;
    expect(await getInteractions(mapk6)).to.be.null;
    expect(await getNeighbouringNodes(mapk6)).to.be.null;
  });

  it('Search for KANK1', async function () {
    let kank1 = 'ncbigene:23189';
    expect(await searchByGeneId(kank1)).to.not.be.null;
    let edges = await getInteractions(kank1);
    expect(edges.length).equal(3);
    expect(_.find(edges, { id: 'd7b2a15d-43bf-4494-815b-a77e08cea59c', doi: '10.1083/jcb.202005214' })).to.be.not.undefined;
    expect(_.find(edges, { id: 'e56263d8-d5b6-4812-bc2f-8d905a66f0f9', doi: '10.7554/eLife.18124' })).to.be.not.undefined;
    expect(_.find(edges, { id: '5a374667-a51d-4aa3-bf93-526fe203b04e', doi: '10.7554/eLife.18124' })).to.be.not.undefined;

    let nodes = await getNeighbouringNodes(kank1);
    expect(nodes.length).equal(3);
    expect(_.find(nodes, { id: 'ncbigene:59274', name: 'TLNRD1' })).to.be.not.undefined;
    expect(_.find(nodes, { id: 'ncbigene:7094', name: 'TLN1' })).to.be.not.undefined;
    expect(_.find(nodes, { id: 'ncbigene:83660', name: 'TLN2' })).to.be.not.undefined;
  });

  it('Search for TLN1', async function () {
    let tln1 = 'ncbigene:7094';
    expect(await searchByGeneId(tln1)).to.not.be.null;
    let edges = await getInteractions(tln1);
    expect(edges.length).equal(6);
    expect(_.find(edges, { id: '028e7366-9779-4466-96ea-18a45bfe3f38', doi: '10.1016/j.str.2016.04.016' })).to.be.not.undefined;
    expect(_.find(edges, { id: '80a4d403-8bc1-4ddb-a4f9-5227e87ef6fa', doi: '10.1016/j.str.2016.04.016' })).to.be.not.undefined;
    expect(_.find(edges, { id: 'e56263d8-d5b6-4812-bc2f-8d905a66f0f9', doi: '10.7554/eLife.18124' })).to.be.not.undefined;
    expect(_.find(edges, { id: '013b7e2a-7240-4668-b628-2653c60f47e9', doi: '10.7554/eLife.18124' })).to.be.not.undefined;
    expect(_.find(edges, { id: '3e7c85db-c2a3-4a1f-b96e-6d187c6ab93b', doi: '10.1016/j.jbc.2021.100837' })).to.be.not.undefined;
    expect(_.find(edges, { id: 'e39d0a06-5b02-44e3-9c36-27cc1f9ac08c', doi: '10.1016/j.jbc.2021.100837' })).to.be.not.undefined;

    let nodes = await getNeighbouringNodes(tln1);
    expect(nodes.length).equal(5);
    expect(_.find(nodes, { id: 'ncbigene:5829', name: 'PXN' })).to.be.not.undefined;
    expect(_.find(nodes, { id: 'ncbigene:983', name: 'CDK1' })).to.be.not.undefined;
    expect(_.find(nodes, { id: 'ncbigene:10395', name: 'DLC1' })).to.be.not.undefined;
    expect(_.find(nodes, { id: 'ncbigene:23189', name: 'KANK1' })).to.be.not.undefined;
    expect(_.find(nodes, { id: 'ncbigene:25959', name: 'KANK2' })).to.be.not.undefined;
  });

  it('Search for TLNRD1', async function () {
    let tlnrd1 = 'ncbigene:59274';
    expect(await searchByGeneId(tlnrd1)).to.not.be.null;
    let edges = await getInteractions(tlnrd1);
    expect(edges.length).equal(5);
    expect(_.find(edges, { id: 'd5d9fbcc-a1d9-4026-b1d3-d4a97faff36b', doi: '10.1083/jcb.202005214' })).to.be.not.undefined;
    expect(_.find(edges, { id: '13ab91d1-ee5f-46ca-a1ea-82ce72a938f4', doi: '10.1083/jcb.202005214' })).to.be.not.undefined;
    expect(_.find(edges, { id: 'd7b2a15d-43bf-4494-815b-a77e08cea59c', doi: '10.1083/jcb.202005214' })).to.be.not.undefined;
    expect(_.find(edges, { id: 'eec84ebe-eece-4143-b406-cd99cdbe2e43', doi: '10.1083/jcb.202005214' })).to.be.not.undefined;
    expect(_.find(edges, { id: 'e59c16c4-11e8-4755-8e2f-f88fe4a73b30', doi: '10.1083/jcb.202005214' })).to.be.not.undefined;

    let nodes = await getNeighbouringNodes(tlnrd1);
    expect(nodes.length).equal(5);
    expect(_.find(nodes, { id: 'ncbigene:59274', name: 'TLNRD1' })).to.be.not.undefined;
    expect(_.find(nodes, { id: 'ncbigene:23189', name: 'KANK1' })).to.be.not.undefined;
    expect(_.find(nodes, { id: 'ncbigene:60', name: 'ACTB' })).to.be.not.undefined;
    expect(_.find(nodes, { id: 'ncbigene:54518', name: 'APBB1IP' })).to.be.not.undefined;
    expect(_.find(nodes, { id: 'ncbigene:65059', name: 'RAPH1' })).to.be.not.undefined;
  });

});