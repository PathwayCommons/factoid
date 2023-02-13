import { makeMAPK6Test, makeGeneNodeTest } from './starting-neo4j.js';

async function makeNodeTest() {
    console.log("Starting makeNodeTest");
    //await makeMAPK6Test();
    await makeGeneNodeTest();
    console.log("Finish makeNodeTest");
}

makeNodeTest();