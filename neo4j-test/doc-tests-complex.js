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
import complex4 from './document/complex_tests_4.json';
import complex5 from './document/complex_tests_5.json';
import complex6 from './document/complex_tests_6.json';

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

  it('Two complexes, 1 node from each interacting with a node from the other complex', async function () {
    let loadTable = name => ({ rethink: r, conn: rdbConn, db: testDb, table: testDb.table(name) });
    let loadTables = () => Promise.all(dbTables.map(loadTable)).then(dbInfos => ({ docDb: dbInfos[0], eleDb: dbInfos[1] }));

    const { document } = await dbFix.Insert(complex4);
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

    expect(await getNumNodes()).to.equal(4);
    for (const n of arrNodes) {
      let id = `${n.association().dbPrefix}:${n.association().id}`;
      expect(await getGeneName(id)).to.equal(`${n.association().name}`);
    }

    expect(await getNumEdges()).to.equal(4);

    expect(arrEdges.length).to.equal(2);
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

    expect(arrComplexEdges.length).to.equal(2); // There are 2 complexes in this document
    const complexId1 = arrComplexEdges[0].id();
    const edge1 = await getComplexEdge('ncbigene:55215', 'ncbigene:2177', complexId1);
    expect(edge1.properties.type).to.equal('binding');
    expect(edge1.type).to.equal('INTERACTION');
    expect(edge1.properties.component).to.deep.equal(['ncbigene:55215', 'ncbigene:2177']);
    expect(edge1.properties.sourceComplex).to.equal('');
    expect(edge1.properties.targetComplex).to.equal('');

    const complexId2 = arrComplexEdges[1].id();
    const edge2 = await getComplexEdge('ncbigene:57599', 'ncbigene:7398', complexId2);
    expect(edge2.properties.type).to.equal('binding');
    expect(edge2.type).to.equal('INTERACTION');
    expect(edge2.properties.component).to.deep.equal(['ncbigene:57599', 'ncbigene:7398']);
    expect(edge2.properties.sourceComplex).to.equal('');
    expect(edge2.properties.targetComplex).to.equal('');
  });

  it('One complex interacting with one non-complex', async function () {
    let loadTable = name => ({ rethink: r, conn: rdbConn, db: testDb, table: testDb.table(name) });
    let loadTables = () => Promise.all(dbTables.map(loadTable)).then(dbInfos => ({ docDb: dbInfos[0], eleDb: dbInfos[1] }));

    const { document } = await dbFix.Insert(complex5);
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

    expect(await getNumEdges()).to.equal(3);

    expect(arrComplexEdges.length).to.equal(1); // There is one complex in this document
    const complexId1 = arrComplexEdges[0].id();
    const edge1 = await getComplexEdge('ncbigene:11335', 'ncbigene:648791', complexId1);
    expect(edge1.properties.type).to.equal('binding');
    expect(edge1.type).to.equal('INTERACTION');
    expect(edge1.properties.component).to.deep.equal(['ncbigene:11335', 'ncbigene:648791']);
    expect(edge1.properties.sourceComplex).to.equal('');
    expect(edge1.properties.targetComplex).to.equal('');

    expect(arrEdges.length).to.equal(1);
    const interactionEdgesId = arrEdges[0].id();
    const interactionEdge1 = await getComplexEdge('ncbigene:11335', 'ncbigene:8737', interactionEdgesId);
    expect(interactionEdge1.properties.type).to.equal(arrEdges[0].type());
    expect(interactionEdge1.type).to.equal('INTERACTION');
    expect(interactionEdge1.properties.component).to.deep.equal([]);
    expect(interactionEdge1.properties.sourceComplex).to.equal(complexId1);
    expect(interactionEdge1.properties.targetComplex).to.equal('');

    const interactionEdge2 = await getComplexEdge('ncbigene:648791', 'ncbigene:8737', interactionEdgesId);
    expect(interactionEdge2.properties.type).to.equal(arrEdges[0].type());
    expect(interactionEdge2.type).to.equal('INTERACTION');
    expect(interactionEdge2.properties.component).to.deep.equal([]);
    expect(interactionEdge2.properties.sourceComplex).to.equal(complexId1);
    expect(interactionEdge2.properties.targetComplex).to.equal('');
  });

  it('One complex interacting with another complex', async function () {
    let loadTable = name => ({ rethink: r, conn: rdbConn, db: testDb, table: testDb.table(name) });
    let loadTables = () => Promise.all(dbTables.map(loadTable)).then(dbInfos => ({ docDb: dbInfos[0], eleDb: dbInfos[1] }));

    const { document } = await dbFix.Insert(complex6);
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

    expect(await getNumNodes()).to.equal(5);
    for (const n of arrNodes) {
      let id = `${n.association().dbPrefix}:${n.association().id}`;
      expect(await getGeneName(id)).to.equal(`${n.association().name}`);
    }

    expect(await getNumEdges()).to.equal(11);

    expect(arrEdges.length).to.equal(2);

    let edge = await getEdge('3b8e906f-d7ea-476b-a15c-4d383a603f22');
    expect(edge.properties.type).to.equal('interaction');
    expect(edge.properties.sourceId).to.equal('ncbigene:64112');
    expect(edge.properties.targetId).to.equal('ncbigene:84557');
    expect(edge.type).to.equal('INTERACTION');
    expect(edge.properties.component).to.deep.equal([]);
    expect(edge.properties.sourceComplex).to.equal('');
    expect(edge.properties.targetComplex).to.equal('');
    expect(edge.properties.xref).to.equal(myDoc.id());
    expect(edge.properties.doi).to.equal(myDoc.citation().doi);
    expect(edge.properties.pmid).to.equal(myDoc.citation().pmid);
    expect(edge.properties.articleTitle).to.equal(myDoc.citation().title);


    expect(arrComplexEdges.length).to.equal(2); // There are 2 complexes in this document
    const complexId1 = arrComplexEdges[0].id();
    const edge1 = await getComplexEdge('ncbigene:84557', 'ncbigene:64112', complexId1);
    expect(edge1.properties.type).to.equal('binding');
    expect(edge1.type).to.equal('INTERACTION');
    expect(edge1.properties.component).to.deep.equal(['ncbigene:84557', 'ncbigene:64112']);
    expect(edge1.properties.sourceComplex).to.equal('');
    expect(edge1.properties.targetComplex).to.equal('');

    const complexId2 = arrComplexEdges[1].id();
    const edge2 = await getComplexEdge('ncbigene:9474', 'ncbigene:9140', complexId2);
    expect(edge2.properties.type).to.equal('binding');
    expect(edge2.type).to.equal('INTERACTION');
    expect(edge2.properties.component).to.deep.equal(['ncbigene:9474', 'ncbigene:9140', 'ncbigene:55054']);
    expect(edge2.properties.sourceComplex).to.equal('');
    expect(edge2.properties.targetComplex).to.equal('');

    const edge3 = await getComplexEdge('ncbigene:9474', 'ncbigene:55054', complexId2);
    expect(edge3.properties.type).to.equal('binding');
    expect(edge3.type).to.equal('INTERACTION');
    expect(edge3.properties.component).to.deep.equal(['ncbigene:9474', 'ncbigene:9140', 'ncbigene:55054']);
    expect(edge3.properties.sourceComplex).to.equal('');
    expect(edge3.properties.targetComplex).to.equal('');

    const edge4 = await getComplexEdge('ncbigene:9140', 'ncbigene:55054', complexId2);
    expect(edge4.properties.type).to.equal('binding');
    expect(edge4.type).to.equal('INTERACTION');
    expect(edge4.properties.component).to.deep.equal(['ncbigene:9474', 'ncbigene:9140', 'ncbigene:55054']);
    expect(edge4.properties.sourceComplex).to.equal('');
    expect(edge4.properties.targetComplex).to.equal('');

    const interactionEdgesId = '002147fb-ea3d-4b4c-a486-b968b317259a';

    const interactionEdge1 = await getComplexEdge('ncbigene:64112', 'ncbigene:9474', interactionEdgesId);
    expect(interactionEdge1.properties.type).to.equal('binding');
    expect(interactionEdge1.type).to.equal('INTERACTION');
    expect(interactionEdge1.properties.component).to.deep.equal([]);
    expect(interactionEdge1.properties.sourceComplex).to.equal(complexId1);
    expect(interactionEdge1.properties.targetComplex).to.equal(complexId2);

    const interactionEdge2 = await getComplexEdge('ncbigene:64112', 'ncbigene:9140', interactionEdgesId);
    expect(interactionEdge2.properties.type).to.equal('binding');
    expect(interactionEdge2.type).to.equal('INTERACTION');
    expect(interactionEdge2.properties.component).to.deep.equal([]);
    expect(interactionEdge2.properties.sourceComplex).to.equal(complexId1);
    expect(interactionEdge2.properties.targetComplex).to.equal(complexId2);

    const interactionEdge3 = await getComplexEdge('ncbigene:64112', 'ncbigene:55054', interactionEdgesId);
    expect(interactionEdge3.properties.type).to.equal('binding');
    expect(interactionEdge3.type).to.equal('INTERACTION');
    expect(interactionEdge3.properties.component).to.deep.equal([]);
    expect(interactionEdge3.properties.sourceComplex).to.equal(complexId1);
    expect(interactionEdge3.properties.targetComplex).to.equal(complexId2);

    const interactionEdge4 = await getComplexEdge('ncbigene:84557', 'ncbigene:9474', interactionEdgesId);
    expect(interactionEdge4.properties.type).to.equal('binding');
    expect(interactionEdge4.type).to.equal('INTERACTION');
    expect(interactionEdge4.properties.component).to.deep.equal([]);
    expect(interactionEdge4.properties.sourceComplex).to.equal(complexId1);
    expect(interactionEdge4.properties.targetComplex).to.equal(complexId2);

    const interactionEdge5 = await getComplexEdge('ncbigene:84557', 'ncbigene:9140', interactionEdgesId);
    expect(interactionEdge5.properties.type).to.equal('binding');
    expect(interactionEdge5.type).to.equal('INTERACTION');
    expect(interactionEdge5.properties.component).to.deep.equal([]);
    expect(interactionEdge5.properties.sourceComplex).to.equal(complexId1);
    expect(interactionEdge5.properties.targetComplex).to.equal(complexId2);

    const interactionEdge6 = await getComplexEdge('ncbigene:84557', 'ncbigene:55054', interactionEdgesId);
    expect(interactionEdge6.properties.type).to.equal('binding');
    expect(interactionEdge6.type).to.equal('INTERACTION');
    expect(interactionEdge6.properties.component).to.deep.equal([]);
    expect(interactionEdge6.properties.sourceComplex).to.equal(complexId1);
    expect(interactionEdge6.properties.targetComplex).to.equal(complexId2);
  });
});