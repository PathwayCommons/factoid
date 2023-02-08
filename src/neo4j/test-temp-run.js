import { helloWorld, makeGeneNodeTest } from './starting-neo4j.js';

async function helloTest() { // eslint-disable-line no-unused-vars
    console.log("We are starting now!");
    await helloWorld();
    console.log("This is my test run!");
}

async function makeNodeTest() {
    console.log("Starting makeNodeTest");
    await makeGeneNodeTest();
    console.log("Finish makeNodeTest");
}

makeNodeTest();