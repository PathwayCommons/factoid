import { numNodes, numEdges, deleteAll, returnEdgeById, returnGene } from './query-strings';
import { getDriver } from './neo4j-driver';

export async function getNode(id) {
  const driver = getDriver();
  let session;
  let node;
  try {
    session = driver.session({ database: "neo4j" });
    let result = await session.executeRead(tx => {
      return tx.run(returnGene, { id: id });
    });
    if (result) {
      node = result.records[0].get('n');
    } else {
      node = null;
    }
  } catch (error) {
    console.error(error);
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
  const driver = getDriver();
  let session;
  let edge;
  try {
    session = driver.session({ database: 'neo4j' });
    let result = await session.executeRead(tx => {
      return tx.run(returnEdgeById, { id: id });
    });
    if (result.records.length > 0) {
      edge = result.records[0].get('r');
    } else {
      edge = null;
    }
  } catch (error) {
    console.error(error);
    throw error;
  } finally {
    await session.close();
  }
  return edge;
}

export async function deleteAllNodesAndEdges() {
  const driver = getDriver();
  let session;
  try {
    session = driver.session({ database: "neo4j" });
    await session.executeWrite(tx => {
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
    num = result.records[0].get(0).toNumber();
  } catch (error) {
    console.error(error);
    throw error;
  } finally {
    await session.close();
  }
  return num;
}