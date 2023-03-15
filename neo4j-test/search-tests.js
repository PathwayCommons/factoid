import { expect } from 'chai';
import rdbFix from 'rethinkdb-fixtures';
import r from 'rethinkdb';

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

describe('Tests for searchByGeneId', function () {

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

  it('Search for KANK1', async function () {
    let kank1 = 'ncbigene:23189';
    const res = await searchByGeneId(kank1);

  });

  it('Search for TLN1', async function () {
    let tln1 = 'ncbigene:7094';
    const res = await searchByGeneId(tln1);

  });

  it('Search for TLNRD1', async function () {
    let tlnrd1 = 'ncbigene:59274';
    const res = await searchByGeneId(tlnrd1);

  });

  it('Search for MAPK6', async function () {
    let mapk6 = 'ncbigene:5597';
    const res = await searchByGeneId(mapk6);
    expect(res).to.be.null;
    expect(await getInteractions(mapk6)).to.be.null;
    expect(await getNeighbouringNodes(mapk6)).to.be.null;
  });

});