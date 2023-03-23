import { expect } from 'chai';
import rdbFix from 'rethinkdb-fixtures';
import r from 'rethinkdb';

import { loadDoc } from '../src/server/routes/api/document/index.js';
import { initDriver, closeDriver } from '../src/neo4j/neo4j-driver.js';
import { addDocumentToNeo4j, convertUUIDtoId } from '../src/neo4j/neo4j-document.js';
import { deleteAllNodesAndEdges, getGeneName, getNumNodes, getNumEdges, getEdge } from '../src/neo4j/test-functions.js';

import complex1 from './document/complex_tests_1.json';

let rdbConn;
let dbFix;
let testDb;
const dbName = 'factoid-neo4j-test';
const dbTables = ['document', 'element']; // Match fixture (JSON) keys

describe('05. Tests for Documents with Complexes', function () {

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
      clear: true //clear tables before inserting.
    });
  });

  after('Close Neo4j driver and RDB connection', async function () {
    await closeDriver();
    await rdbConn.close();
  });

  beforeEach('Delete nodes and edges from Neo4j', async function () {
    await deleteAllNodesAndEdges();
  });

  afterEach('Drop dummy Doc', async function () {
    await dbFix.Delete(dbTables);
  });

  it('Add the elements of MAPK6-AKT1 dummy doc to Neo4j db', async function () {
    let loadTable = name => ({ rethink: r, conn: rdbConn, db: testDb, table: testDb.table(name) });
    let loadTables = () => Promise.all(dbTables.map(loadTable)).then(dbInfos => ({ docDb: dbInfos[0], eleDb: dbInfos[1] }));

    const { document } = await dbFix.Insert(complex1);
    const { docDb, eleDb } = await loadTables();
    const loadDocs = ({ id, secret }) => loadDoc({ docDb, eleDb, id, secret });
    const fixtureDocs = await Promise.all(document.map(loadDocs));

    let myDoc = fixtureDocs[0];

    expect(await getNumNodes()).to.equal(0);
    expect(await getNumEdges()).to.equal(0);
    await addDocumentToNeo4j(myDoc);

    //let arrNodes = myDoc.elements().filter(ele => ele.isEntity());
    //let arrEdges = myDoc.elements().filter(ele => !(ele.isEntity()));

  });

});