// const neo4j = require('neo4j-driver');   <-- old, read up on imports and exports in book
import neo4j from 'neo4j-driver';

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

    return Promise.all(docPromises);
}

async function getAllDocs() {// eslint-disable-line no-unused-vars
    const url = 'https://biofactoid.org/api/document/a896d611-affe-4b45-a5e1-9bc560ffceab';

    const res = await fetch(`${url}`);
    const docJSONs = await res.json();
    return await toDocs(docJSONs, this.docSocket, this.eleSocket);
}


const driver = neo4j.driver('bolt://52.23.228.198:7687', neo4j.auth.basic('neo4j', 'metals-wires-alarms')); // free sandbox. temporary

// Format of nodeData are as follows:
// { id: 'element.association.dbPrefix'+ ':' + 'element.association.id', factoidId: 'element.id',
// name: 'element.name', type: 'element.type', dbId: 'element.association.id',
// dbName: "element.association.dbName"}
const nodeData = [
    // MAPK6 data
    {
        id: 'ncbigene:5597', factoidId: '598f8bef-f858-4dd0-b1c6-5168a8ae5349', name: 'MAPK6',
        type: 'protein', dbId: '5597', dbName: 'NCBI Gene'
    },
    // AKT data
    {
        id: 'ncbigene:207', factoidId: '4081348e-20b8-4bf8-836f-695827a4f9a2', name: 'AKT',
        type: 'protein', dbId: '207', dbName: 'NCBI Gene'
    }
];

const makeNodeQuery =
    `MERGE (gene:Gene {id: $id})
    ON CREATE SET gene.factoidId = $factoidId, 
    gene.name = $name,
    gene.type = $type,
    gene.dbId = $dbId,
    gene.dbName = $dbName
    RETURN gene.name`;

// this test makes the MAPK6 node
export async function makeMAPK6Test() {
    let session;
    try {
        session = driver.session({ database: "neo4j" });
        let result = await session.run(makeNodeQuery, nodeData[0]);
        console.log("Gene Node created:", result.records[0].get(0));
    } catch (error) {
        console.error(error);
        throw error;
    } finally {
    session.close();
    driver.close();
    }
}

// this test does as I want (make both nodes at once) but it doesn't 
//   exit by itself (need to use Ctrl-C)
export async function makeGeneNodeTest() {
    //let session;
    for (let i = 0; i < nodeData.length; i++) {
        let session;
        try {
            session = driver.session({ database: "neo4j" });
            let result = await session.run(makeNodeQuery, nodeData[i]);
            console.log("Gene Node created");
            session.close();
        } catch (error) {
            console.error(error);
            session.close();
            driver.close();
            throw error;
        }
    }
}

// Parameters of relationshipData are as follows:
// { id1: 'element.association.dbPrefix'+ ':' + 'element.association.id',
// id2: 'element.association.dbPrefix'+ ':' + 'element.association.id', id3: 'element.id',
// type: 'element.type', doi: 'value.citation.doi',
// pmid: 'value.citation.pmid', documentId: 'value.id', title: 'value.citation.title'}
const relationshipData = [{
    id1: 'ncbigene:5597', id2: 'ncbigene:207', id3: '01ef22cc-2a8e-46d4-9060-6bf1c273869b',
    type: 'phosphorylation', doi: '10.1126/sciadv.abi6439', pmid: '34767444',
    documentId: 'a896d611-affe-4b45-a5e1-9bc560ffceab',
    title: 'MAPK6-AKT signaling promotes tumor growth and resistance to mTOR kinase blockade.'
}];

const makeRelationshipQuery =
    `MATCH (x:Gene {id: $id1})
    MATCH (y:Gene {id: $id2})
    MERGE (x)-[r:INTERACTION {id: $id3}]->(y)
    ON CREATE SET r.type = $type,
    r.doi = $doi, 
    r.pmid = $pmid,
    r.documentId = $documentId,
    r.title = $title`;

export async function test() { // This test does not yet work!!!
    const session = driver.session({ database: "neo4j" });
    await session
        .beginTransaction()
        .then(transaction => {
            transaction.run(makeNodeQuery, nodeData) // Step 1: Make the nodes
                .then(result1 => {
                    console.log("Nodes created:", result1.summary.counters.nodesCreated);
                    // Step 2: Make the relationship
                    return transaction.run(makeRelationshipQuery, relationshipData);
                })
                .then(result2 => {
                    console.log(result2.records.map(record => record.get("type")));
                    return transaction.commit();
                })
                .then(() => {
                    session.close();
                    driver.close();
                });
        });
}