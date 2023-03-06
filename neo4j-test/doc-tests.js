import { expect } from 'chai';
import { getDocuments } from '../src/server/routes/api/document/index.js';
import testDoc from './testDoc.json';
import uuid from 'uuid';
import { loadTables, createDoc, deleteDoc } from '../src/neo4j/get-doc-functions.js';
import { initDriver, closeDriver } from '../src/neo4j/neo4j-driver.js';
import { addDocumentToNeo4j } from '../src/neo4j/neo4j-document.js';
import { deleteAllNodesAndEdges, getGeneName, getNumNodes, getNumEdges, getEdge } from '../src/neo4j/test-functions.js';

// Note: Before running, make sure to delete entries in database
//        and restart everything (npm run watch)

describe('Tests for Documents', function () {

  before('Should create a driver instance and connect to server', async function () {
    await initDriver();
  });

  after('Close driver', async function () {
    await closeDriver();
  });

  beforeEach('Delete nodes and edges', async function () {
    await deleteAllNodesAndEdges();
  });

  let dummyDoc;

  beforeEach('Create a dummy doc', async function () {
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

  it('Make sure dummy doc has been made with necessary fields', async function () {
    const { total, results } = await getDocuments({});
    const myDummyDoc = results.filter(d => d.id == dummyDoc.id());
    expect(myDummyDoc.length).to.equal(1);

    let myDoc = myDummyDoc[0];
    expect(myDoc.id).to.equal(dummyDoc.id());
    expect(myDoc.citation.doi).to.equal(null); //to.equal('10.1126/sciadv.abi6439');
    expect(myDoc.citation.pmid).to.equal(null); //to.equal('34767444');
    expect(myDoc.text).to.equal('MAPK6 activates AKT via phosphorylation.');

    expect(myDoc.elements.length).to.equal(3);

    let first = myDoc.elements[0];
    expect(first.association.dbPrefix).to.equal('ncbigene');
    expect(first.association.name).to.equal('MAPK6');
    expect(first.association.id).to.equal('5597');

    let second = myDoc.elements[1];
    expect(second.association.dbPrefix).to.equal('ncbigene');
    expect(second.association.name).to.equal('AKT1');
    expect(second.association.id).to.equal('207');

    let third = myDoc.elements[2];
    expect(third.id).to.equal('01ef22cc-2a8e-46d4-9060-6bf1c273869b');
    expect(third.type).to.equal('phosphorylation');
    expect(third.entries.length).to.equal(2);
    expect(third.entries[0].id).to.equal('598f8bef-f858-4dd0-b1c6-5168a8ae5349');
    expect(third.entries[1].id).to.equal('4081348e-20b8-4bf8-836f-695827a4f9a2');
  });

  it('Add the elements of dummy doc to Neo4j db', async function () {
    const { total, results } = await getDocuments({});
    const myDummyDoc = results.filter(d => d.id == dummyDoc.id());
    let myDoc = myDummyDoc[0];
    expect(await getNumNodes()).equal(0);
    expect(await getNumEdges()).equal(0);
    addDocumentToNeo4j(myDoc);

    expect(await getGeneName('ncbigene:5597')).equal('MAPK6');
    expect(await getGeneName('ncbigene:5597')).equal('MAPK6');
    expect(await getNumNodes()).equal(2);

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