import { addNode, addEdge } from './neo4j-functions';

export async function addDocumentToNeo4j() {
  // Step 1: Sort each element in a document into one of two categories
  //              a. Node/Gene
  //              b. Edge/Interaction
  let arrNodes = [];
  let arrEdges = [];

  // Step 2: Make all the nodes
  for (let i = 0; i < arrNodes.length; i++) {
    let node = arrNodes[i];
    addNode(node.id, node.name);
  }

  // Step 3: Make all the edges
  for (let i = 0; i < arrEdges.length; i++) {
    let edge = arrEdges[i];
    addEdge(edge.id, edge.type, edge.sourceId, edge.targetId,
      edge.xref, edge.doi, edge.pmid, edge.articleTitle);
  }

  // Note to self: addNode and addEdge in loops will require
  //   the driver to open and close each time. Make new functions
  //   that only do it once?

}
