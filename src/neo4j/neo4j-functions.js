import { giveConnectedInfoByGeneId, makeNodeQuery, makeEdgeQuery } from './query-strings';
import { getDriver } from './neo4j-driver';
import _ from 'lodash';

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
 * @param { String } participantTypes 'noncomplex-to-noncomplex', 'complex-to-noncomplex', etc
 * @param { String } xref document UUID
 * @param { String } doi 
 * @param { String } pmid 
 * @param { String } articleTitle 
 * @returns 
 */
export async function addEdge(id, type, sourceId, targetId, participantTypes, xref, doi, pmid, articleTitle) {
    const driver = getDriver();
    let session;
    try {
        session = driver.session({ database: "neo4j" });
        await session.executeWrite(tx => {
            return tx.run(makeEdgeQuery, {
                id: id.toLowerCase(),
                type: type,
                sourceId: sourceId.toLowerCase(),
                targetId: targetId.toLowerCase(),
                participantTypes: participantTypes.toLowerCase(),
                xref: xref.toLowerCase(),
                doi: doi,
                pmid: pmid,
                articleTitle: articleTitle
            });
        });
    } catch (error) {
        throw error;
    } finally {
        await session.close();
    }
    return;
}

export async function addComplexEdge(id, sourceId, targetId, allParticipants) {
    // TO DO
    
    return;
}

/**
 * @param { String } id in the form of "dbName:dbId", ex: "ncbigene:207"
 * @returns An object with 2 fields: relationships (array) and neighbouring nodes (array) or null
 */
export async function searchByMoleculeId(id) {
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
    let record = await searchByMoleculeId(id);
    if (record) {
        return _.uniqBy(record.map(row => {
            return row.get('m').properties;
        }), node => node.id);
    }
    return null;
}

/**
 * @param {*} id in the form of "dbName:dbId", ex: "ncbigene:207"
 * @returns an array of relationships leading away from/leading to the specified gene
 */
export async function getInteractions(id) {
    let record = await searchByMoleculeId(id);
    if (record) {
        return _.uniqBy(record.map(row => {
            return row.get('r').properties;
        }), edge => edge.id);
    }
    return null;
}