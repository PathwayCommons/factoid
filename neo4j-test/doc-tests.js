import { expect } from 'chai';
import rdbFix from 'rethinkdb-fixtures';

import fixture from './testDoc.json';
import { loadDoc } from '../src/server/routes/api/document/index.js';
import { initDriver, closeDriver } from '../src/neo4j/neo4j-driver.js';
import { addDocumentToNeo4j, convertUUIDtoId } from '../src/neo4j/neo4j-document.js';
import { deleteAllNodesAndEdges, getGeneName, getNumNodes, getNumEdges, getEdge } from '../src/neo4j/test-functions.js';
import r from 'rethinkdb';

let rdbConn;
let dbFix;
let fixtureDocs;
let testDb;
const dbName = 'factoid-neo4j-test';
const dbTables = ['document', 'element']; // Match fixture (JSON) keys

describe('Tests for Documents', function () {

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

  beforeEach('Create a dummy doc', async function () {
    let loadTable = name => ({ rethink: r, conn: rdbConn, db: testDb, table: testDb.table(name) });
    let loadTables = () => Promise.all(dbTables.map(loadTable)).then(dbInfos => ({ docDb: dbInfos[0], eleDb: dbInfos[1] }));

    const { document } = await dbFix.Insert(fixture);
    const { docDb, eleDb } = await loadTables();
    const loadDocs = ({ id, secret }) => loadDoc({ docDb, eleDb, id, secret });
    fixtureDocs = await Promise.all(document.map(loadDocs));
  });

  afterEach('Drop dummy Doc', async function () {
    await dbFix.Delete(dbTables);
  });

  it('Add the elements of dummy doc to Neo4j db', async function () {
    let myDoc = fixtureDocs[0];

    expect(await getNumNodes()).equal(0);
    expect(await getNumEdges()).equal(0);
    await addDocumentToNeo4j(myDoc);

    let arrNodes = [];
    let arrEdges = [];
    let docElements = myDoc.elements();
    for (const e of docElements) {
      if (e.isEntity()) {
        arrNodes.push(e);
      } else {
        arrEdges.push(e);
      }
    }

    expect(await getNumNodes()).equal(arrNodes.length);
    for (const n of arrNodes) {
      let id = `${n.association().dbPrefix}:${n.association().id}`;
      expect(await getGeneName(id)).equal(`${n.association().name}`);
    }
    //expect(await getNumNodes()).equal(2);
    //expect(await getGeneName('ncbigene:5597')).equal('MAPK6');
    //expect(await getGeneName('ncbigene:207')).equal('AKT1');

    //expect(await getNumEdges()).equal(1);
    expect(await getNumEdges()).equal(arrEdges.length);
    for (const e of arrEdges) {
      let edge = await getEdge(e.id());
      expect(edge.properties.type).equal(e.type());
      expect(edge.properties.sourceId).equal(convertUUIDtoId(myDoc, e.association().getSource().id()));
      expect(edge.properties.targetId).equal(convertUUIDtoId(myDoc, e.association().getTarget().id()));
      expect(edge.type).equal('INTERACTION');
      expect(edge.properties.xref).equal(myDoc.id());
      expect(edge.properties.doi).equal(myDoc.citation().doi);
      expect(edge.properties.pmid).equal(myDoc.citation().pmid);
      expect(edge.properties.articleTitle).equal(myDoc.citation().title);
    }
    //let edge = await getEdge('01ef22cc-2a8e-46d4-9060-6bf1c273869b');
    //expect(edge.properties.type).equal('phosphorylation');
    //expect(edge.properties.sourceId).equal('ncbigene:5597');
    //expect(edge.properties.targetId).equal('ncbigene:207');
    //expect(edge.type).equal('INTERACTION');
    //expect(edge.properties.xref).equal(myDoc.id());
    //expect(edge.properties.doi).equal(myDoc.citation().doi);
    //expect(edge.properties.pmid).equal(myDoc.citation().pmid);
    //expect(edge.properties.articleTitle).equal(myDoc.citation().title);
  });

});