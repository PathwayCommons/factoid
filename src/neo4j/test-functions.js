import { numNodes, numEdges, deleteAll, returnEdgeArticleTitleById } from './query-strings';
import { getDriver } from './neo4j-driver';

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