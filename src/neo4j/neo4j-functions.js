import neo4j from 'neo4j-driver';
import {
    giveConnectedInfoByGeneId, makeNodeQuery, makeRelationshipQuery,
    numNodes, numEdges, returnEdgeArticleTitleById
} from './query-strings';
import { closeDriver, getDriver, initDriver } from './neo4j-driver';

export async function addNode(id, name) {
    const driver = getDriver();
    let session;
    try {
        session = driver.session({ database: "neo4j" });
        // eslint-disable-next-line no-unused-vars
        let result = await session.executeWrite(tx => {
            return tx.run(makeNodeQuery, {
                id: id.toLowerCase(),
                name: name
            });
        });
    } catch (error) {
        console.error(error);
        throw error;
    } finally {
        await session.close();
    }
    return;
}

export async function addEdge(id, type, sourceId, targetId, xref, doi, pmid, articleTitle) {
    const driver = getDriver();
    let session;
    try {
        session = driver.session({ database: "neo4j" });
        // eslint-disable-next-line no-unused-vars
        let result = await session.executeWrite(tx => {
            return tx.run(makeRelationshipQuery, {
                id: id.toLowerCase(),
                type: type,
                sourceId: sourceId.toLowerCase(),
                targetId: targetId.toLowerCase(),
                xref: xref.toLowerCase(),
                doi: doi,
                pmid: pmid,
                articleTitle: articleTitle
            });
        });
    } catch (error) {
        console.error(error);
        throw error;
    } finally {
        await session.close();
    }
    return;
}

export async function searchByGeneId(id) {
    const driver = getDriver();
    let session;
    try {
        session = driver.session({ database: "neo4j" });
        let result = await session.executeRead(tx => {
            return tx.run(giveConnectedInfoByGeneId, { id: id });
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
    }
    return;
}

export async function getEdgeArticleTitleById(id) {
    const driver = getDriver();
    let session;
    let articleTitle;
    try {
        session = driver.session({ database: 'neo4j' });
        let result = session.executeRead(tx => {
            return tx.run(returnEdgeArticleTitleById, { id: id });
        });
        articleTitle = result.records.get('articleTitle');
    } catch (error) {
        console.error(error);
        throw error;
    } finally {
        await session.close();
    }
    return articleTitle;
}

export async function deleteAll() {
    const driver = getDriver();
    let session;
    try {
        session = driver.session({ database: "neo4j" });
        let result = await session.executeWrite(tx => {
            return tx.run(deleteAll);
        });
    } catch (error) {
        console.error(error);
        throw error;
    } finally {
        await session.close();
    }
    return;
}

export async function getNumNodes() {
    const driver = getDriver();
    let session;
    let num;
    try {
        session = driver.session({ database: "neo4j" });
        let result = await session.executeRead(tx => {
            return tx.run(numNodes);
        });
        num = result.records[0].get(0).toNumber();
        console.log(num.toString());
    } catch (error) {
        console.error(error);
        throw error;
    } finally {
        await session.close();
    }
    return num;
}

export async function getNumEdges() {
    const driver = getDriver();
    let session;
    let num;
    try {
        session = driver.session({ database: "neo4j" });
        let result = await session.executeRead(tx => {
            return tx.run(numEdges);
        });
        num = result.records.map(row => {
            return row.get('count');
        });
    } catch (error) {
        console.error(error);
        throw error;
    } finally {
        await session.close();
    }
    return num;
}

