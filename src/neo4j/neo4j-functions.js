import { giveConnectedInfoByGeneId, makeNodeQuery, makeRelationshipQuery } from './query-strings';
import { getDriver } from './neo4j-driver';

/**
 * @param { String } id in the form of "dbName:dbId", ex: "ncbigene:207"
 * @param { String } name 
 * @returns 
 */
export async function addNode(id, name) {
    const driver = getDriver();
    let session;
    try {
        session = driver.session({ database: "neo4j" });
        await session.executeWrite(tx => {
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

/**
 * @param { String } id interaction element's UUID (NOT document id)
 * @param { String } type 
 * @param { String } sourceId in the form of "dbName:dbId", ex: "ncbigene:207"
 * @param { String } targetId in the form of "dbName:dbId", ex: "ncbigene:207"
 * @param { String } xref document UUID
 * @param { String } doi 
 * @param { String } pmid 
 * @param { String } articleTitle 
 * @returns 
 */
export async function addEdge(id, type, sourceId, targetId, xref, doi, pmid, articleTitle) {
    const driver = getDriver();
    let session;
    try {
        session = driver.session({ database: "neo4j" });
        await session.executeWrite(tx => {
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

/**
 * @param { String } id in the form of "dbName:dbId", ex: "ncbigene:207"
 * @returns An object with 2 fields: relationships (array) and neighbouring nodes (array) or null
 */
export async function searchByGeneId(id) {
    const driver = getDriver();
    let session;
    let record;
    try {
        session = driver.session({ database: "neo4j" });
        let result = await session.executeRead(tx => {
            return tx.run(giveConnectedInfoByGeneId, { id: id });
        });
        if (result.records.length > 0) {
            record = result.records;
        } else {
            record = null;
        }
    } catch (error) {
        console.error(error);
        throw error;
    } finally {
        await session.close();
    }
    return record;
}

/**
 * @param { String } id in the form of "dbName:dbId", ex: "ncbigene:207"
 * @returns an array of nodes that are neighbours to the specified gene
 */
export async function getNeighbouringNodes(id) {
    let record = await searchByGeneId(id);
    if (record) {
        return record.map(row => {
            return row.get('m');
        });
    }
    return null;
}

/**
 * @param {*} id in the form of "dbName:dbId", ex: "ncbigene:207"
 * @returns an array of relationships leading away from/leading to the specified gene
 */
export async function getInteractions(id) {
    let record = await searchByGeneId(id);
    if (record) {
        return record.map(row => {
            return row.get('r');
        });
    }
    return null;
}