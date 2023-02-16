import { addNode, addEdge, searchByGeneId } from './neo4j-functions';

async function testingFunctions() {
    console.log("Begin test");
    // Add MAPK6 Node
    await addNode('ncbigene:5597', 'MAPK6');

    // Add AKT Node
    await addNode('ncbigene:207', 'AKT');

    // Add Interaction
    await addEdge(
        '01ef22cc-2a8e-46d4-9060-6bf1c273869b',
        'phosphorylation',
        'ncbigene:5597', 
        'ncbigene:207',
        'a896d611-affe-4b45-a5e1-9bc560ffceab',
        '10.1126/sciadv.abi6439', 
        '34767444',
        'MAPK6-AKT signaling promotes tumor growth and resistance to mTOR kinase blockade.'
    );

    // Search for MAPK6
    await searchByGeneId("ncbigene:5597");
    // Search for AKT
    await searchByGeneId("ncbigene:207");

    console.log("End test");
}

testingFunctions();