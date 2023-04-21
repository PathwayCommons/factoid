import { numNodes, numEdges, returnEdgeById, returnEdgeByIdAndEndpoints, returnGene } from './query-strings.js';
import { guaranteeSession } from './neo4j-driver.js';

/**
 * Given a node id, find the node in Neo4j DB and return 
 * To see name: getNode(id).properties.name
 * 
 * @param { String } id in the form of "dbName:dbId", ex: "ncbigene:207"
 * @returns null, or record of a node 
 */
export async function getNode(id) {
  let session;
  let node;
  try {
    session = guaranteeSession();
    let result = await session.executeRead(tx => {
      return tx.run(returnGene, { id: id });
    });
    if (result.records.length > 0) {
      node = result.records[0].get('n');
    } else {
      node = null;
    }
  } catch (error) {
    throw error;
  } finally {
    await session.close();
  }
  return node;
}

/**
 * Given a node id, find the node name in Neo4j DB and return
 * 
 * @param { String } id in the form of "dbName:dbId", ex: "ncbigene:207"
 * @returns null, or String
 */
export async function getGeneName(id) {
  let node = await getNode(id);
  if (node) {
    return node.properties.name;
  }
  return null;
}

/**
 * Given an edge id, find the edge in Neo4j DB and return
 * To see type: getEdge(id).properties.type, etc.
 * 
 * @param { String } id in the form of factoid UUID
 * @returns null, or record of an edge. 
 */
export async function getEdge(id) {
  let session;
  let edge;
  try {
    session = guaranteeSession();
    let result = await session.executeRead(tx => {
      return tx.run(returnEdgeById, { id: id });
    });
    if (result.records.length > 0) {
      edge = result.records[0].get('r');
    } else {
      edge = null;
    }
  } catch (error) {
    throw error;
  } finally {
    await session.close();
  }
  return edge;
}

/**
 * Given an edge id, find the edge in Neo4j DB and return
 * To see type: getEdgeByIdAndEndpoints(id).properties.type, etc.
 * 
 * @param { String } sourceId in the form of "dbName:dbId", ex: "ncbigene:207"
 * @param { String } targetId in the form of "dbName:dbId", ex: "ncbigene:207"
 * @param { String } complexId in the form of factoid UUID
 * @returns 
 */
export async function getEdgeByIdAndEndpoints(sourceId, targetId, complexId) {
  let session;
  let edge;
  try {
    session = guaranteeSession();
    let result = await session.executeRead(tx => {
      return tx.run(returnEdgeByIdAndEndpoints,
        { sourceId: sourceId, targetId: targetId, complexId: complexId });
    });
    if (result.records.length > 0) {
      edge = result.records[0].get('r');
    } else {
      edge = null;
    }
  } catch (error) {
    throw error;
  } finally {
    await session.close();
  }
  return edge;
}

/**
 * Return number of nodes present in Neo4j DB
 * 
 * @returns Int
 */
export async function getNumNodes() {
  let session;
  let num;
  try {
    session = guaranteeSession();
    let result = await session.executeRead(tx => {
      return tx.run(numNodes);
    });
    num = result.records[0].get(0).toNumber();
  } catch (error) {
    throw error;
  } finally {
    await session.close();
  }
  return num;
}

/**
 * Return number of edges present in Neo4j DB
 * 
 * @returns Int
 */
export async function getNumEdges() {
  let session;
  let num;
  try {
    session = guaranteeSession();
    let result = await session.executeRead(tx => {
      return tx.run(numEdges);
    });
    num = result.records[0].get(0).toNumber();
  } catch (error) {
    throw error;
  } finally {
    await session.close();
  }
  return num;
}