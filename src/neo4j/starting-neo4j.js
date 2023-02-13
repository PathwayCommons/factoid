import neo4j from 'neo4j-driver';
import { makeNodeQuery, makeRelationshipQuery } from './query-strings';
import { nodeData, relationshipData } from './graph-data';

const driver = neo4j.driver('bolt://localhost:7687');

// this test makes the MAPK6 node. Successful
export async function makeMAPK6Test() {
    let session;
    try {
        session = driver.session({ database: "neo4j" });
        let result = await session.executeWrite(makeNodeQuery, nodeData[0]);
        console.log("Gene Node created:", result.records[0].get('gene.name'));
    } catch (error) {
        console.error(error);
        throw error;
    } finally {
        await session.close();
        driver.close();
    }
    return;
}

// this test makes both the MAPK6 node and the AKT node, then terminates successfully
export async function makeGeneNodeTest() {
    //let session;
    for (let i = 0; i < nodeData.length; i++) {
        let session;
        try {
            session = driver.session({ database: "neo4j" });
            let result = await session.run(makeNodeQuery, nodeData[i]);
            console.log("Gene Node created: ", result.records);
            await session.close();
        } catch (error) {
            console.error(error);
            await session.close();
            throw error;
        }
    }
    driver.close();
    console.log("Loop ends!");
    return;
}

// This test does not yet work!!!
export async function test() { 
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