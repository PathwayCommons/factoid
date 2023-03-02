import { expect } from 'chai';
import { getDocuments } from '../src/server/routes/api/document/index.js';
import testDoc from './testDoc.json';
import uuid from 'uuid';
import { loadTables, createDoc, deleteDoc } from '../src/neo4j/get-doc-functions.js';

describe('Tests for addNode, addEdge and seachByGeneId', function () {

  let dummyDoc;

  before('Should create a dummy doc', async function () {
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

  after('Drop dummy Doc', async function () {
    await deleteDoc(dummyDoc);
  });

  it('Blah blah', async function () {
    const { total, results } = await getDocuments({});
    const myDummyDoc = results.filter(d => d.id == dummyDoc.id());
    expect(myDummyDoc.length).to.equal(1);
  });
});