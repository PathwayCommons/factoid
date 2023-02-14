import neo4j from 'neo4j-driver';
import { giveInfoByGeneId, makeNodeQuery, makeRelationshipQuery } from './query-strings';

export async function addNode(params) {
    const driver = neo4j.driver('bolt://localhost:7687');
    let session;
    try {
        session = driver.session({ database: "neo4j" });
        let result = await session.executeWrite(tx => {
            return tx.run(makeNodeQuery, params);
        });
    } catch (error) {
        console.error(error);
        throw error;
    } finally {
        await session.close();
        driver.close();
    }
    return;
}

export async function addEdge(params) {
    const driver = neo4j.driver('bolt://localhost:7687');
    let session;
    try {
        session = driver.session({ database: "neo4j" });
        let result = await session.executeWrite(tx => {
            return tx.run(makeRelationshipQuery, params);
        });
    } catch (error) {
        console.error(error);
        throw error;
    } finally {
        await session.close();
        driver.close();
    }
    return;
}

export async function searchByGeneId(id) {
    const driver = neo4j.driver('bolt://localhost:7687');
    let session;
    try {
        session = driver.session({ database: "neo4j" });
        let result = await session.executeRead(tx => {
            return tx.run(giveInfoByGeneId, { id: id });
        });
        let nodes = result.records.map(row => {
            return row.get('m');
        });
        let edges = result.records.map(row => {
            return row.get('r');
        });
        console.log(nodes);
        console.log(edges);
    } catch (error) {
        console.error(error);
        throw error;
    } finally {
        await session.close();
        driver.close();
    }
    return;
}