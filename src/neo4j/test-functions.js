import { numNodes, numEdges, returnEdgeById, returnEdgeByIdAndEndpoints, returnGene } from './query-strings.js';
import { guaranteeSession } from './neo4j-driver.js';

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

export async function getGeneName(id) {
  let node = await getNode(id);
  if (node) {
    return node.properties.name;
  }
  return null;
}

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