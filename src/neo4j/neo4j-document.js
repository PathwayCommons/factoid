import { addNode, addEdge } from './neo4j-functions';

let nodeTypes = ['entity', 'ggp', 'dna', 'rna', 'protein', 'chemical', 'complex'];

function convertUUIDtoId(docElements, id) {
  for (let i = 0; i < docElements.length; i++) {
    let e = docElements[i];
    if (e.id() == id) {
      return `${e.association().dbPrefix}:${e.association().id}`;
    }
  }
  return 'node id not found';
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
    if (nodeTypes.includes(e.type())) {
      let nodeInfo = {
        id: `${e.association().dbPrefix}:${e.association().id}`,
        name: e.association().name
      };
      arrNodes.push(nodeInfo);
    } else {
      let sourceUUId;
      let targetUUId;
      let entries = e.elements();
      if (entries[0].group == null) {
        sourceUUId = entries[0].id();
        targetUUId = entries[1].id();
      } else {
        sourceUUId = entries[1].id();
        targetUUId = entries[0].id();
      }
      let edgeInfo = {
        id: e.id(),
        type: e.type(),
        sourceId: convertUUIDtoId(docElements, sourceUUId),
        targetId: convertUUIDtoId(docElements, targetUUId)
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
