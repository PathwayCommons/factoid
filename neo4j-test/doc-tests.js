import { expect } from 'chai';
import rdbFix from 'rethinkdb-fixtures';
import fixture from './testFixture.json';
import { loadDoc, loadTables } from '../src/server/routes/api/document/index.js';
import { initDriver, closeDriver } from '../src/neo4j/neo4j-driver.js';
import { addDocumentToNeo4j } from '../src/neo4j/neo4j-document.js';
import { deleteAllNodesAndEdges, getGeneName, getNumNodes, getNumEdges, getEdge } from '../src/neo4j/test-functions.js';

describe('Tests for Documents', function () {

  let dbFix;
  let fixtureDocs;

  before('Should create a driver instance and connect to server', async function () {
    await initDriver();
    dbFix = rdbFix({
      db: 'test',
      clear: true //clear tables before inserting.
    });
  });

  after('Close driver', async function () {
    await closeDriver();
  });

  beforeEach('Delete nodes and edges', async function () {
    await deleteAllNodesAndEdges();
  });

  beforeEach('Create a dummy doc', async function () {
    const { docDb, eleDb } = await loadTables();
    const loadDocs = ({ id, secret }) => loadDoc({ docDb, eleDb, id, secret });
    const { document } = await dbFix.Insert(fixture);
    fixtureDocs = await Promise.all(document.map( loadDocs ));
  });

  afterEach('Drop dummy Doc', async function () {
    await dbFix.Delete(['document', 'element']);
  });

  it('Add the elements of dummy doc to Neo4j db', async function () {
    let myDoc = fixtureDocs[0];

    expect(await getNumNodes()).equal(0);
    expect(await getNumEdges()).equal(0);
    await addDocumentToNeo4j(myDoc); // TODO - should operate on Document instance
    // expect(await getNumNodes()).equal(2);
    // expect(await getGeneName('ncbigene:5597')).equal('MAPK6');
    // expect(await getGeneName('ncbigene:207')).equal('AKT1');

    // expect(await getNumEdges()).equal(1);
    // let edge = await getEdge('01ef22cc-2a8e-46d4-9060-6bf1c273869b');
    // expect(edge.type).equal('INTERACTION');
    // expect(edge.properties.type).equal('phosphorylation');
    // expect(edge.properties.sourceId).equal('ncbigene:5597');
    // expect(edge.properties.targetId).equal('ncbigene:207');
    // expect(edge.properties.xref).equal(myDoc.id);
    // expect(edge.properties.doi).equal('10.1126/sciadv.abi6439');
    // expect(edge.properties.pmid).equal('34767444');
    // expect(edge.properties.articleTitle).equal('MAPK6-AKT signaling promotes tumor growth and resistance to mTOR kinase blockade.');
  });

});