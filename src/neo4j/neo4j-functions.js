import {
    giveConnectedInfoByGeneId, makeNodeQuery, makeEdgeQuery,
    giveConnectedInfoByGeneIdNoComplexes, giveConnectedInfoForDocument
} from './query-strings';
import { getDriver } from './neo4j-driver';
import _ from 'lodash';

const dbName = 'neo4j';

/**
 * @param { String } id in the form of "dbName:dbId", ex: "ncbigene:207"
 * @param { String } name 
 * @returns 
 */
export async function addNode(id, name) {
    const driver = getDriver();
    let session;
    try {
        session = driver.session({ database: dbName });
        await session.executeWrite(tx => {
            return tx.run(makeNodeQuery, {
                id: id.toLowerCase(),
                name: name
            });
        });
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
export async function addEdge(id, type, component, sourceId, targetId, sourceComplex, targetComplex, xref, doi, pmid, articleTitle) {
    const driver = getDriver();
    let session;
    try {
        session = driver.session({ database: dbName });
        await session.executeWrite(tx => {
            return tx.run(makeEdgeQuery, {
                id: id.toLowerCase(),
                type: type,
                component: component,
                sourceId: sourceId.toLowerCase(),
                targetId: targetId.toLowerCase(),
                sourceComplex: sourceComplex.toLowerCase(),
                targetComplex: targetComplex.toLowerCase(),
                xref: xref.toLowerCase(),
                doi: doi,
                pmid: pmid,
                articleTitle: articleTitle
            });
        });
    } finally {
        await session.close();
    }
    return;
}

/**
 * @param { String } id in the form of "dbName:dbId", ex: "ncbigene:207"
 * @returns null if node not in database, array of objects with
 * fields for the nodes and edges otherwise
 */
export async function neighbourhood(id, withComplexes = true) {
    const driver = getDriver();
    let session;
    let record;
    try {
        session = driver.session({ database: dbName });
        let result = await session.executeRead(tx => {
            if (withComplexes) {
                return tx.run(giveConnectedInfoByGeneId, { id: id });
            } else {
                return tx.run(giveConnectedInfoByGeneIdNoComplexes, { id: id });
            }
        });
        if (result.records.length > 0) {
            record = result.records;
        } else {
            record = null;
        }
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
    let record = await neighbourhood(id);
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
    let record = await neighbourhood(id);
    if (record) {
        return _.uniqBy(record.map(row => {
            return row.get('r').properties;
        }), edge => edge.id);
    }
    return null;
}

export async function neighbourhoodWithoutComplexes(id) {
    const driver = getDriver();
    let session;
    let record;
    try {
        session = driver.session({ database: dbName });
        let result = await session.executeRead(tx => {
            return tx.run(giveConnectedInfoByGeneIdNoComplexes, { id: id });
        });
        if (result.records.length > 0) {
            record = result.records;
        } else {
            record = null;
        }
    } finally {
        await session.close();
    }
    return record;
}

/**
 * Get the graph pertaining to a specific factoid document
 * @param { String } id factoid UUID for document
 * @returns null if document does not exist in database, array of objects with
 * fields for the nodes and edges otherwise
 */
export async function get(id) {
    const driver = getDriver();
    let session;
    let record;
    try {
        session = driver.session({ database: dbName });
        let result = await session.executeRead(tx => {
            return tx.run(giveConnectedInfoForDocument, { id: id });
        });
        if (result.records.length > 0) {
            record = result.records;
        } else {
            record = null;
        }
    } finally {
        await session.close();
    }
    return record;
}