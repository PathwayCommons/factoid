import { expect } from 'chai';
import rdbFix from 'rethinkdb-fixtures';
import r from 'rethinkdb';

import { loadDoc } from '../src/server/routes/api/document/index.js';
import { initDriver, closeDriver } from '../src/neo4j/neo4j-driver.js';
import { addDocumentToNeo4j, convertUUIDtoId } from '../src/neo4j/neo4j-document.js';
import { deleteAllNodesAndEdges, getGeneName, getNumNodes, getNumEdges, getEdge, getComplexEdge } from '../src/neo4j/test-functions.js';

import complex1 from './document/complex_tests_1.json';
import complex2 from './document/complex_tests_2.json';
import complex3 from './document/complex_tests_3.json';

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

  it('Two nodes in one complex', async function () {
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

    let arrNodes = myDoc.elements().filter(ele => ele.isEntity() && !ele.isComplex());
    let arrEdges = myDoc.elements().filter(ele => !(ele.isEntity()));
    let arrComplexEdges = myDoc.elements().filter(ele => ele.isComplex());

    expect(await getNumNodes()).to.equal(2);
    for (const n of arrNodes) {
      let id = `${n.association().dbPrefix}:${n.association().id}`;
      expect(await getGeneName(id)).to.equal(`${n.association().name}`);
    }

    expect(await getNumEdges()).to.equal(1);

    expect(arrEdges.length).to.equal(0);

    expect(arrComplexEdges.length).to.equal(1);
    let complexId = arrComplexEdges[0].id();
    let edge1 = await getComplexEdge('ncbigene:22882', 'ncbigene:3091', complexId);
    expect(edge1.properties.type).to.equal('binding');
    expect(edge1.type).to.equal('INTERACTION');
    expect(edge1.properties.component).to.deep.equal(['ncbigene:22882', 'ncbigene:3091']);
    expect(edge1.properties.sourceComplex).to.equal('');
    expect(edge1.properties.targetComplex).to.equal('');
    expect(edge1.properties.xref).to.equal(myDoc.id());
    expect(edge1.properties.doi).to.equal(myDoc.citation().doi);
    expect(edge1.properties.pmid).to.equal(myDoc.citation().pmid);
    expect(edge1.properties.articleTitle).to.equal(myDoc.citation().title);
  });

  it('Three nodes in one complex, edges between them', async function () {
    let loadTable = name => ({ rethink: r, conn: rdbConn, db: testDb, table: testDb.table(name) });
    let loadTables = () => Promise.all(dbTables.map(loadTable)).then(dbInfos => ({ docDb: dbInfos[0], eleDb: dbInfos[1] }));

    const { document } = await dbFix.Insert(complex2);
    const { docDb, eleDb } = await loadTables();
    const loadDocs = ({ id, secret }) => loadDoc({ docDb, eleDb, id, secret });
    const fixtureDocs = await Promise.all(document.map(loadDocs));

    let myDoc = fixtureDocs[0];

    expect(await getNumNodes()).to.equal(0);
    expect(await getNumEdges()).to.equal(0);
    await addDocumentToNeo4j(myDoc);

    let arrNodes = myDoc.elements().filter(ele => ele.isEntity() && !ele.isComplex());
    let arrEdges = myDoc.elements().filter(ele => !(ele.isEntity()));
    let arrComplexEdges = myDoc.elements().filter(ele => ele.isComplex());

    expect(await getNumNodes()).to.equal(3);
    for (const n of arrNodes) {
      let id = `${n.association().dbPrefix}:${n.association().id}`;
      expect(await getGeneName(id)).to.equal(`${n.association().name}`);
    }

    expect(await getNumEdges()).to.equal(6);

    expect(arrEdges.length).to.equal(3);
    for (const e of arrEdges) {
      let edge = await getEdge(e.id());
      expect(edge.properties.type).to.equal(e.type());
      if (e.association().getSource()) {
        expect(edge.properties.sourceId).to.equal(convertUUIDtoId(myDoc, e.association().getSource().id()));
        expect(edge.properties.targetId).to.equal(convertUUIDtoId(myDoc, e.association().getTarget().id()));
      } else {
        expect(edge.properties.sourceId).to.equal(convertUUIDtoId(myDoc, e.elements()[0].id()));
        expect(edge.properties.targetId).to.equal(convertUUIDtoId(myDoc, e.elements()[1].id()));
      }
      expect(edge.type).to.equal('INTERACTION');
      expect(edge.properties.component).to.deep.equal([]);
      expect(edge.properties.sourceComplex).to.equal('');
      expect(edge.properties.targetComplex).to.equal('');
      expect(edge.properties.xref).to.equal(myDoc.id());
      expect(edge.properties.doi).to.equal(myDoc.citation().doi);
      expect(edge.properties.pmid).to.equal(myDoc.citation().pmid);
      expect(edge.properties.articleTitle).to.equal(myDoc.citation().title);
    }

    expect(arrComplexEdges.length).to.equal(1); // There is one complex in the document, 3 edges
    const complexId = arrComplexEdges[0].id();
    const edge1 = await getComplexEdge('ncbigene:3303', 'ncbigene:7157', complexId);
    expect(edge1.properties.type).to.equal('binding');
    expect(edge1.type).to.equal('INTERACTION');
    expect(edge1.properties.component).to.deep.equal(['ncbigene:3303', 'ncbigene:7157', 'ncbigene:3326']);
    expect(edge1.properties.sourceComplex).to.equal('');
    expect(edge1.properties.targetComplex).to.equal('');

    const edge2 = await getComplexEdge('ncbigene:3303', 'ncbigene:3326', complexId);
    expect(edge2.properties.type).to.equal('binding');
    expect(edge2.type).to.equal('INTERACTION');
    expect(edge2.properties.component).to.deep.equal(['ncbigene:3303', 'ncbigene:7157', 'ncbigene:3326']);
    expect(edge2.properties.sourceComplex).to.equal('');
    expect(edge2.properties.targetComplex).to.equal('');

    const edge3 = await getComplexEdge('ncbigene:7157', 'ncbigene:3326', complexId);
    expect(edge3.properties.type).to.equal('binding');
    expect(edge3.type).to.equal('INTERACTION');
    expect(edge3.properties.component).to.deep.equal(['ncbigene:3303', 'ncbigene:7157', 'ncbigene:3326']);
    expect(edge3.properties.sourceComplex).to.equal('');
    expect(edge3.properties.targetComplex).to.equal('');
  });

  it('Two nodes in one complex, 1 node interacting with a non-complex', async function () {
    let loadTable = name => ({ rethink: r, conn: rdbConn, db: testDb, table: testDb.table(name) });
    let loadTables = () => Promise.all(dbTables.map(loadTable)).then(dbInfos => ({ docDb: dbInfos[0], eleDb: dbInfos[1] }));

    const { document } = await dbFix.Insert(complex3);
    const { docDb, eleDb } = await loadTables();
    const loadDocs = ({ id, secret }) => loadDoc({ docDb, eleDb, id, secret });
    const fixtureDocs = await Promise.all(document.map(loadDocs));

    let myDoc = fixtureDocs[0];

    expect(await getNumNodes()).to.equal(0);
    expect(await getNumEdges()).to.equal(0);
    await addDocumentToNeo4j(myDoc);

    let arrNodes = myDoc.elements().filter(ele => ele.isEntity() && !ele.isComplex());
    let arrEdges = myDoc.elements().filter(ele => !(ele.isEntity()));
    let arrComplexEdges = myDoc.elements().filter(ele => ele.isComplex());

    expect(await getNumNodes()).to.equal(3);
    for (const n of arrNodes) {
      let id = `${n.association().dbPrefix}:${n.association().id}`;
      expect(await getGeneName(id)).to.equal(`${n.association().name}`);
    }

    expect(await getNumEdges()).to.equal(2);

    expect(arrEdges.length).to.equal(1);
    for (const e of arrEdges) {
      let edge = await getEdge(e.id());
      expect(edge.properties.type).to.equal(e.type());
      if (e.association().getSource()) {
        expect(edge.properties.sourceId).to.equal(convertUUIDtoId(myDoc, e.association().getSource().id()));
        expect(edge.properties.targetId).to.equal(convertUUIDtoId(myDoc, e.association().getTarget().id()));
      } else {
        expect(edge.properties.sourceId).to.equal(convertUUIDtoId(myDoc, e.elements()[0].id()));
        expect(edge.properties.targetId).to.equal(convertUUIDtoId(myDoc, e.elements()[1].id()));
      }
      expect(edge.type).to.equal('INTERACTION');
      expect(edge.properties.component).to.deep.equal([]);
      expect(edge.properties.sourceComplex).to.equal('');
      expect(edge.properties.targetComplex).to.equal('');
      expect(edge.properties.xref).to.equal(myDoc.id());
      expect(edge.properties.doi).to.equal(myDoc.citation().doi);
      expect(edge.properties.pmid).to.equal(myDoc.citation().pmid);
      expect(edge.properties.articleTitle).to.equal(myDoc.citation().title);
    }

    expect(arrComplexEdges.length).to.equal(1); // There is one complex in the document, 1 edge
    const complexId = arrComplexEdges[0].id();
    const edge1 = await getComplexEdge('ncbigene:90550', 'ncbigene:27173', complexId);
    expect(edge1.properties.type).to.equal('binding');
    expect(edge1.type).to.equal('INTERACTION');
    expect(edge1.properties.component).to.deep.equal(['ncbigene:90550', 'ncbigene:27173']);
    expect(edge1.properties.sourceComplex).to.equal('');
    expect(edge1.properties.targetComplex).to.equal('');
  });
});