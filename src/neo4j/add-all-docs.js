import { addAllDocumentsToNeo4j } from "./neo4j-document";
import { initDriver, closeDriver } from "./neo4j-driver";
import { deleteAllNodesAndEdges } from "./test-functions";


// To call, use 'node -r esm src/neo4j/add-all-docs.js' in terminal

async function addAll() {
  try {
    await initDriver();
    await deleteAllNodesAndEdges();
    await addAllDocumentsToNeo4j();
  } catch (error) {
    throw (error);
  } finally {
    await closeDriver();
  }
  return;
}

addAll();