import neo4j from 'neo4j-driver';
import { giveConnectedInfoByGeneId, makeNodeQuery, makeRelationshipQuery } from './query-strings';
import { getDriver } from './neo4j-driver';

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
    let record;
    try {
        session = driver.session({ database: "neo4j" });
        let result = await session.executeRead(tx => {
            return tx.run(giveConnectedInfoByGeneId, { id: id });
        });
        if (result) {
            record = result.records;
        } else {
            record = null;
        }
        let nodes = result.records.map(row => {
            return row.get('m');
        });
        let edges = result.records.map(row => {
            return row.get('r');
        });
        //console.log(nodes);
        //console.log(edges);
    } catch (error) {
        console.error(error);
        throw error;
    } finally {
        await session.close();
    }
    return record;
}

