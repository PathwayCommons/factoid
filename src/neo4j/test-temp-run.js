import { read1, test, makeMAPK6Test, makeGeneNodeTest } from './starting-neo4j.js';
import { addNode, addEdge, searchByGeneId } from './neo4j-functions';

async function makeNodeTest() { // eslint-disable-line no-unused-vars
    console.log("Starting makeNodeTest");
    //await makeMAPK6Test();
    //await makeGeneNodeTest();
    //await test();
    await read1();
    console.log("Finish makeNodeTest");
}

async function testingAddFunctions() {
    console.log("Begin test");
    // Add MAPK6 Node
    await addNode({
        id: 'ncbigene:5597', factoidId: '598f8bef-f858-4dd0-b1c6-5168a8ae5349', name: 'MAPK6',
        type: 'protein', dbId: '5597', dbName: 'NCBI Gene'
    })

    // Add AKT Node
    await addNode({
        id: 'ncbigene:207', factoidId: '4081348e-20b8-4bf8-836f-695827a4f9a2', name: 'AKT',
        type: 'protein', dbId: '207', dbName: 'NCBI Gene'
    })

    // Add Interaction
    
    console.log("End test");
}

testingAddFunctions();