import _ from 'lodash';
import { guaranteeSession } from './neo4j-driver.js';
import {
    constraint, giveConnectedInfoByGeneId, makeNodeQuery, makeEdgeQuery,
    giveConnectedInfoByGeneIdNoComplexes, giveConnectedInfoForDocument,
    deleteAll
} from './query-strings.js';

/**
 * Sets a constraint that all nodes must have unique ids in Neo4j graph db
 * 
 * @returns 
 */
export async function createConstraint() {
    let session;
    try {
        session = guaranteeSession();
        await session.executeWrite(tx => {
            return tx.run(constraint);
        });
    } finally {
        await session.close();
    }
    return null;
}

/**
 * Makes one node in Neo4j graph database
 * 
 * @param { String } id in the form of "dbName:dbId", ex: "ncbigene:207"
 * @param { String } name
 * @returns
 */
export async function addNode(id, name) {
    let session;
    try {
        session = guaranteeSession();
        await session.executeWrite(tx => {
            return tx.run(makeNodeQuery, {
                id: id.toLowerCase(),
                name: name
            });
        });
    } finally {
        await session.close();
    }
    return null;
}

/**
 * Makes one relationship (edge) in Neo4j graph database
 * 
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
export async function addEdge(id, type, group, component, sourceId, targetId, sourceComplex, targetComplex, xref, doi, pmid, articleTitle) {
    let session;
    try {
        session = guaranteeSession();
        await session.executeWrite(tx => {
            return tx.run(makeEdgeQuery, {
                id: id.toLowerCase(),
                type: type.toLowerCase(),
                group: group.toLowerCase(),
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
    return null;
}

/**
 * Given a node's id, finds the immediate nodes and edges connected to it
 * 
 * @param { String } id in the form of "dbName:dbId", ex: "ncbigene:207"
 * @param { Boolean } withComplexes default true to show complexes
 * @returns null if node not in database, array of objects with
 * fields for the nodes and edges otherwise
 */
export async function neighbourhood(id, withComplexes = true) {
    let session;
    let record;
    try {
        session = guaranteeSession();
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
 * @param { Boolean } withComplexes default true to show complexes
 * @returns an array of nodes that are neighbours to the specified gene
 */
export async function getNeighbouringNodes(id, withComplexes = true) {
    let record = await neighbourhood(id, withComplexes);
    if (record) {
        return _.uniqBy(record.map(row => {
            return row.get('m').properties;
        }), edge => edge.id);
    }
    return null;
}

/**
 * @param {*} id in the form of "dbName:dbId", ex: "ncbigene:207"
 * @param { Boolean } withComplexes default true to show complexes
 * @returns an array of relationships leading away from/leading to the specified gene
 */
export async function getInteractions(id, withComplexes = true) {
    let record = await neighbourhood(id, withComplexes);
    if (record) {
        return record.map(row => {
            return row.get('r').properties;
        });
    }
    return null;
}

/**
 * Returns the results of neighbourhood function in the format of an object
 * with 2 fields (one for neighbouring nodes and one for edges)
 * 
 * @param {*} id in the form of "dbName:dbId", ex: "ncbigene:207"
 * @param { Boolean } withComplexes default true to show complexes
 * @returns null if id not found in database, object with 2 fields (one for neighbouring nodes and one for
 * edges) otherwise
 */
export async function neighbourhoodReadable(id, withComplexes = true) {
    let record = await neighbourhood(id, withComplexes);
    if (record) {
        return {
            nodes: _.uniqBy(record.map(row => { return row.get('m').properties; }), edge => edge.id),
            edges: record.map(row => { return row.get('r').properties; })
        };
    }
    return null;
}

/**
 * Get the graph pertaining to a specific factoid document
 * 
 * @param { String } id factoid UUID for document
 * @returns null if document does not exist in database, object with 2 fields (one for nodes and one for
 * edges) otherwise
 */
export async function get(id) {
    let session;
    let record;
    try {
        session = guaranteeSession();
        let result = await session.executeRead(tx => {
            return tx.run(giveConnectedInfoForDocument, { id: id });
        });
        if (result.records.length > 0) {
            record = {
                nodes: _.unionBy(result.records.map(row => { return row.get('n').properties; }),
                    result.records.map(row => { return row.get('m').properties; }),
                    node => node.id),
                edges: result.records.map(row => { return row.get('r').properties; })
            };
        } else {
            record = null;
        }
    } finally {
        await session.close();
    }
    return record;
}

/**
 * Remove all nodes and edges from the database
 * @returns Promise<>
 */
export async function deleteAllNodesAndEdges() {
    let session;
    try {
        session = guaranteeSession();
        await session.executeWrite(async tx => {
            return await tx.run(deleteAll);
        });
    } catch (error) {
        throw error;
    } finally {
        await session.close();
    }
    return null;
}