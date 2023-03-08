import { expect } from 'chai';
import { getDocuments } from '../src/server/routes/api/document/index.js';
import testDoc from './testDoc.json';
import uuid from 'uuid';
import { loadTables, createDoc, deleteDoc } from '../src/neo4j/get-doc-functions.js';
import { initDriver, closeDriver } from '../src/neo4j/neo4j-driver.js';
import { addDocumentToNeo4j } from '../src/neo4j/neo4j-document.js';
import { deleteAllNodesAndEdges, getGeneName, getNumNodes, getNumEdges, getEdge } from '../src/neo4j/test-functions.js';
import r from 'rethinkdb';

const dbName = 'factoid-neo4j-test';
let rdbConn;

describe('Tests for Documents', function () {

  before('Create a Neo4j driver instance and connect to server. Connect to RDB', async function () {
    await initDriver();

    rdbConn = await r.connect({ host: 'localhost', db: dbName });
    const exists = await r.dbList().contains(dbName).run(rdbConn);
    if (!exists) {
      await r.dbCreate(dbName).run(rdbConn);
    }
  });

  after('Close Neo4j driver and RDB connection', async function () {
    await closeDriver();
    await rdbConn.close();
  });

  beforeEach('Delete nodes and edges from Neo4j and Delete RDB db', async function () {
    await deleteAllNodesAndEdges();

    // ensure clean rdb before each test
    //await r.dbDrop(dbName).run(); // delete db for rdb

    try {
      await r.dbDrop(dbName).run(rdbConn);
      console.log(`Database '${dbName}' dropped.`);
    } catch (err) {
      if (err.message !== 'Database `your_database_name` does not exist.') {
        throw err;
      }
    }

    try {
      const result = await r.dbCreate(dbName).run(rdbConn);
      console.log(`Database '${result.config_changes[0].new_val}' created.`);
    } catch (err) {
      throw err;
    }
  });

  let dummyDoc;

  beforeEach('Make a dummy doc', async function () {
    const { docDb, eleDb } = await loadTables();

    const id = uuid(); //npm uuid
    const secret = uuid(); // npm uuid
    const provided = {
      'authorEmail': 'jw24li@uwaterloo.ca',
      'authorName': 'Linda',
      'name': 'Linda',
      'paperId': 'HUWE1 is a molecular link controlling RAF-1 activity supported by the Shoc2 scaffold.'
    };
    dummyDoc = await createDoc({ docDb, eleDb, id, secret, provided });
    await dummyDoc.fromJson(testDoc);
  });

  afterEach('Drop dummy Doc', async function () {
    await deleteDoc(dummyDoc);
  });

  it('Add the elements of dummy doc to Neo4j db', async function () {
    const { total, results } = await getDocuments({});
    const myDummyDoc = results.filter(d => d.id == dummyDoc.id());
    let myDoc = myDummyDoc[0];

    expect(await getNumNodes()).equal(0);
    expect(await getNumEdges()).equal(0);
    await addDocumentToNeo4j(myDoc);

    expect(await getNumNodes()).equal(2);
    expect(await getGeneName('ncbigene:5597')).equal('MAPK6');
    expect(await getGeneName('ncbigene:207')).equal('AKT1');

    expect(await getNumEdges()).equal(1);
    let edge = await getEdge('01ef22cc-2a8e-46d4-9060-6bf1c273869b');
    expect(edge.type).equal('INTERACTION');
    expect(edge.properties.type).equal('phosphorylation');
    expect(edge.properties.sourceId).equal('ncbigene:5597');
    expect(edge.properties.targetId).equal('ncbigene:207');
    expect(edge.properties.xref).equal(myDoc.id);
    expect(edge.properties.doi).equal('10.1126/sciadv.abi6439');
    expect(edge.properties.pmid).equal('34767444');
    expect(edge.properties.articleTitle).equal('MAPK6-AKT signaling promotes tumor growth and resistance to mTOR kinase blockade.');
  });

});