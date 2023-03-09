import { addNode, addEdge } from './neo4j-functions';

function convertUUIDtoId(doc, id) {
  let node = doc.get(id);
  if (node) {
    return `${node.association().dbPrefix}:${node.association().id}`;
  }
  return 'node not found';
}

/**
 * addDocumentToNeo4j takes doc as a parameter and creates the associated nodes 
 * and edges in a Neo4j database
 * @param { Document } doc is a document model instance
 * @returns 
 */
export async function addDocumentToNeo4j(doc) {

  // Step 1: Sort each element in a document into one of two categories
  //              a. Node/Gene
  //              b. Edge/Interaction
  let arrNodes = [];
  let arrEdges = [];
  let docElements = doc.elements();
  for (let i = 0; i < docElements.length; i++) {
    let e = docElements[i];
    if (e.isEntity()) {
      let nodeInfo = {
        id: `${e.association().dbPrefix}:${e.association().id}`,
        name: e.association().name
      };
      arrNodes.push(nodeInfo);
    } else {
      let sourceUUId = e.association().getSource().id();
      let targetUUId = e.association().getTarget().id();
      let edgeInfo = {
        id: e.id(),
        type: e.type(),
        sourceId: convertUUIDtoId(doc, sourceUUId),
        targetId: convertUUIDtoId(doc, targetUUId)
      };
      arrEdges.push(edgeInfo);
    }
  }

  let docCitations = {
    xref: doc.id(),
    doi: doc.citation().doi ? doc.citation().doi : 'not found',
    pmid: doc.citation().pmid ? doc.citation().pmid : 'not found',
    articleTitle: doc.citation().title ? doc.citation().title : 'not found'
  };

  // Step 2: Make all the nodes
  for (let i = 0; i < arrNodes.length; i++) {
    let node = arrNodes[i];
    await addNode(node.id, node.name);
  }

  // Step 3: Make all the edges
  for (let i = 0; i < arrEdges.length; i++) {
    let edge = arrEdges[i];
    await addEdge(edge.id, edge.type, edge.sourceId, edge.targetId,
      docCitations.xref, docCitations.doi, docCitations.pmid, docCitations.articleTitle);
  }

  return;
}
