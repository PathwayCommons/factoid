import { read1, test, makeMAPK6Test, makeGeneNodeTest } from './starting-neo4j.js';

async function makeNodeTest() {
    console.log("Starting makeNodeTest");
    //await makeMAPK6Test();
    //await makeGeneNodeTest();
    //await test();
    await read1();
    console.log("Finish makeNodeTest");
}

makeNodeTest();