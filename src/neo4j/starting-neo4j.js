import neo4j from 'neo4j-driver';
import { giveInfoByGeneId, makeNodeQuery, makeRelationshipQuery } from './query-strings';
import { nodeData, relationshipData } from './graph-data';

const driver = neo4j.driver('bolt://localhost:7687');

// makes the MAPK6 node. Successful
export async function makeMAPK6Test() {
    let session;
    try {
        session = driver.session({ database: "neo4j" });
        let result = await session.executeWrite(tx => {
            return tx.run(makeNodeQuery, nodeData[0]);
        });
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

// makes both the MAPK6 node and the AKT node, then terminates. Successful
export async function makeGeneNodeTest() {
    for (let i = 0; i < nodeData.length; i++) {
        let session;
        try {
            session = driver.session({ database: "neo4j" });
            let result = await session.executeWrite(tx => {
                return tx.run(makeNodeQuery, nodeData[i]);
            });
            console.log("Gene Node created: ", result.records);
        } catch (error) {
            console.error(error);
            throw error;
        } finally {
            await session.close();
        }
    }
    driver.close();
    console.log("Loop ends!");
    return;
}

// makes the MAPK6 node, AKT node and the relationship between them. Successful
export async function test() { 
    let session;
    try {
        session = driver.session({ database: "neo4j" });
        const tx = session.beginTransaction();
        try {
            // Step 1: Make the nodes
            for (let i = 0; i < nodeData.length; i++) {
            let result = await tx.run(makeNodeQuery, nodeData[i]);
            console.log("Gene Node created: ", result.records);
            }

            // Step 2: Make the relationship
            tx.run(makeRelationshipQuery, relationshipData[0]);
            console.log ("Relationship made!");

            await tx.commit();
        } catch(error) {
            await tx.rollback();
            console.error(error);
            throw error;
        }
    } catch(error) {
        console.error(error);
        throw error;
    } finally {
        await session.close();
    }
    driver.close();
    return;
}

// this test reads the database. Use case of: user gives "ncbigene:207" and 
//     the database returns all nodes and relationships connected to it
export async function read1() {
    let session;
    try {
        session = driver.session({ database: "neo4j" });
        let result = await session.executeRead(tx => {
            return tx.run(giveInfoByGeneId, { id: 'ncbigene:207' });
        });
        let names = result.records.map(row => {
            return row.get('m');
        });
        console.log(names);
    } catch (error) {
        console.error(error);
        throw error;
    } finally {
        await session.close();
        driver.close();
    }
    return;
}