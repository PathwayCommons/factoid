import { addNode, addEdge } from './neo4j-functions';

let nodeTypes = ['entity', 'ggp', 'dna', 'rna', 'protein', 'chemical', 'complex'];

function convertUUIDtoId(docElements, id) {
  for (let i = 0; i < docElements.length; i++) {
    let e = docElements[i];
    if (e.id == id) {
      return `${e.association.dbPrefix}:${e.association.id}`;
    }
  }
  return 'node id not found';
}

export async function addDocumentToNeo4j(doc) {

  // Step 1: Sort each element in a document into one of two categories
  //              a. Node/Gene
  //              b. Edge/Interaction
  let arrNodes = [];
  let arrEdges = [];
  let docElements = doc.elements;
  for (let i = 0; i < docElements.length; i++) {
    let e = docElements[i];
    if (nodeTypes.includes(e.type)) {
      let nodeInfo = {
        id: `${e.association.dbPrefix}:${e.association.id}`,
        name: e.association.name
      };
      arrNodes.push(nodeInfo);
    } else {
      let sourceUUId;
      let targetUUId;
      if (e.entries[0].group == null) {
        sourceUUId = e.entries[0].id;
        targetUUId = e.entries[1].id;
      } else {
        sourceUUId = e.entries[1].id;
        targetUUId = e.entries[0].id;
      }
      let edgeInfo = {
        id: e.id,
        type: e.type,
        sourceId: convertUUIDtoId(docElements, sourceUUId),
        targetId: convertUUIDtoId(docElements, targetUUId)
      };
      arrEdges.push(edgeInfo);
    }
  }

  let docCitations = {
    xref: doc.id,
    doi: '10.1126/sciadv.abi6439', //doc.citation.doi,
    pmid: '34767444', //doc.citation.pmid,
    articleTitle: 'MAPK6-AKT signaling promotes tumor growth and resistance to mTOR kinase blockade.' //doc.citation.title
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
