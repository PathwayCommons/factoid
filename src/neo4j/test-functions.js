import {
  numNodes, numEdges, deleteAll, returnEdgeArticleTitleById,
  returnGeneNameById, returnEdgeById
} from './query-strings';
import { getDriver } from './neo4j-driver';

export async function getGeneNameById(id) {
  const driver = getDriver();
  let session;
  let name;
  try {
    session = driver.session({ database: 'neo4j' });
    let result = await session.executeRead(tx => {
      return tx.run(returnGeneNameById, { id: id });
    });
    if (result.records.length > 0) {
      name = result.records[0].get('name');
    } else {
      name = 'No matching gene found';
    }
  } catch (error) {
    console.error(error);
    throw error;
  } finally {
    await session.close();
  }
  return name;
}

export async function getEdgebyId(id) {
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