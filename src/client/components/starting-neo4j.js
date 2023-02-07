async function loadDoc(data, docSocket, eleSocket) {
    const { id, secret } = data;

    const doc = new Document({
        socket: docSocket,
        factoryOptions: { socket: eleSocket },
        data: { id, secret }
    });

    await doc.load();
    await doc.sync(true);

    return doc;
}

async function toDocs(docJSONs, docSocket, eleSocket) {
  const docPromises = docJSONs.map(async docJSON => await loadDoc(docJSON, docSocket, eleSocket));

  return Promise.all( docPromises );
}

async function getAllDocs() {// eslint-disable-line no-unused-vars
  const url = 'https://biofactoid.org/api/document/a896d611-affe-4b45-a5e1-9bc560ffceab';

  const res = await fetch(`${url}`);
  const docJSONs = await res.json();
  return await toDocs(docJSONs, this.docSocket, this.eleSocket);
}

const neo4j = require('neo4j-driver');
const driver = neo4j.driver('bolt://52.23.228.198:7687', neo4j.auth.basic('neo4j', 'metals-wires-alarms')); // free sandbox. temporary

const makeNodeQuery = 'MERGE (gene:Gene {id: $id}) \n'
+ 'ON CREATE SET gene.factoidId = $factoidId, \n'
+ 'gene.name = $name, \n'
+ 'gene.type = $type, \n'
+ 'gene.dbId = $dbId, \n'
+ 'gene.dbName = $dbName)';

// Format of nodeData are as follows:
// { id: 'element.association.dbPrefix'+ ':' + 'element.association.id', factoidId: 'element.id',
// name: 'element.name', type: 'element.type', dbId: 'element.association.id',
// dbName: "element.association.dbName"}
const nodeData = [
    // MAPK6 data
    { id: 'ncbigene:5597', factoidId: '598f8bef-f858-4dd0-b1c6-5168a8ae5349', name: 'MAPK6', 
    type: 'protein', dbId: '5597', dbName: 'NCBI Gene'}, 
    // AKT data
    { id: 'ncbigene:207', factoidId: '4081348e-20b8-4bf8-836f-695827a4f9a2', name: 'AKT', 
    type: 'protein', dbId: '207', dbName: 'NCBI Gene'}
];

const makeRelationshipQuery = 'MATCH (x:Gene {id: $id1}) \n'
+ 'MATCH (y:Gene {id: $id2}) \n'
+ 'WHERE (element.id = $id3) \n'
+ 'MERGE (x)-[r:INTERACTION {id: $id3}]->(y) \n'
+ 'ON CREATE SET r.type = $type, \n'
+ 'r.createdDate = $createdDate, \n'
+ 'r.lastEditedDate = $lastEditedDate, \n'
+ 'r.abstract = $abstract, \n'
+ 'r.text = $text, \n'
+ 'r.doi = $doi, \n'
+ 'r.pmid = $pmid, \n'
+ 'r.ISODate = $ISODate, \n'
+ 'r.authors = $abbreviation, \n'
+ 'r.documentId = $documentId \n'
+ 'r.title = $title';

// Parameters of edgeData are as follows:
// { id1: 'element.association.dbPrefix'+ ':' + 'element.association.id',
// id2: 'element.association.dbPrefix'+ ':' + 'element.association.id', id3: 'element.id',
// type: 'element.type', createdDate: 'value.createdDate',
// lastEditedDate: 'value.lastEditedDate', abstract: 'value.citation.abstract',
// text: 'value.text', doi: 'value.citation.doi',
// pmid: 'value.citation.pmid', ISODate: 'value.citation.ISODate',
// abbreviation: 'value.citation.authors.abbreviation', documentId: 'value.id', title: 'value.citation.title'}
const edgeData = [{ id1: 'ncbigene:5597', id2: 'ncbigene:207', id3: '01ef22cc-2a8e-46d4-9060-6bf1c273869b',
type: 'phosphorylation', createdDate: '2022-12-14T21:16:57.000Z', lastEditedDate: '2022-12-15T14:41:51.000Z', 
abstract: 'PLACEHOLDER TEXT', text: 'MAPK6 activates AKT via phosphorylation.', 
doi: '10.1126/sciadv.abi6439', pmid: '34767444', ISODate: '2021-11-12T00:00:00.000Z',
abbreviation: 'Qinbo Cai, Wolong Zhou, Wei Wang, ..., Feng Yang', documentId: 'a896d611-affe-4b45-a5e1-9bc560ffceab', 
title: 'MAPK6-AKT signaling promotes tumor growth and resistance to mTOR kinase blockade.'}];

const session = driver.session({database:"neo4j"});
session
.beginTransaction()
.then(transaction => {
    transaction.run(makeNodeQuery, nodeData) // Step 1: Make the nodes
    .then(result1 => {
        console.log("Nodes created:", result1.summary.counters.nodesCreated);
        return transaction.run (makeRelationshipQuery, edgeData); // Step 2: Make the relationship
    })
    .then (result2 => {
        console.log(result2.records.map(record => record.get("type")));
        return transaction.commit();
    })
    .then (() => {
        session.close();
        driver.close();
    });
});