import { helloWorld, test } from './starting-neo4j.js';

async function running() {
    console.log("We are starting now!");
    await helloWorld();
    console.log("This is my test run!");
}

 running();