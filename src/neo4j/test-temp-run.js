import { read1, test, makeMAPK6Test, makeGeneNodeTest } from './starting-neo4j.js';
import { addNode, addEdge, searchByGeneId } from './neo4j-functions';

async function makeNodeTest() { // eslint-disable-line no-unused-vars
    console.log("Starting makeNodeTest");
    await makeMAPK6Test();
    await makeGeneNodeTest();
    await test();
    await read1();
    console.log("Finish makeNodeTest");
}

async function testingAddFunctions() {
    console.log("Begin test");
    // Add MAPK6 Node
    await addNode('ncbigene:5597', 'MAPK6', 'protein', '5597', 'NCBI Gene');

    // Add AKT Node
    await addNode('ncbigene:207', 'AKT', 'protein', '207', 'NCBI Gene');

    // Add Interaction
    await addEdge({
        id1: 'ncbigene:5597', id2: 'ncbigene:207', id3: '01ef22cc-2a8e-46d4-9060-6bf1c273869b',
        type: 'phosphorylation', doi: '10.1126/sciadv.abi6439', pmid: '34767444',
        documentId: 'a896d611-affe-4b45-a5e1-9bc560ffceab',
        title: 'MAPK6-AKT signaling promotes tumor growth and resistance to mTOR kinase blockade.'
    });

    // Search for MAPK6
    await searchByGeneId("ncbigene:5597");
    // Search for AKT
    await searchByGeneId("ncbigene:207");

    console.log("End test");
}

testingAddFunctions();