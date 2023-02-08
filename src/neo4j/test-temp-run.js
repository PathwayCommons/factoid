import { test } from './starting-neo4j.js';

async function running() {
    console.log("We are starting now!");
    await test();
    console.log("This is my test run!");
}

running();