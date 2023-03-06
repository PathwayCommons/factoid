import { addNode, addEdge } from './neo4j-functions';

let nodeTypes = ['entity', 'ggp', 'dna', 'rna', 'protein', 'chemical', 'complex'];

export async function addDocumentToNeo4j(doc) {

  // Step 1: Sort each element in a document into one of two categories
  //              a. Node/Gene
  //              b. Edge/Interaction
  let arrNodes = [];
  let arrEdges = [];
  let docElements = doc.elements;
  for (let i = 0; i < docElements.length; i++) {
    let e = docElements[i];
    console.log(e.type);
    if (nodeTypes.includes(e.type)) {
      let nodeInfo = {
        id: e.association.dbPrefix + ':' + e.association.id,
        name: e.association.name
      };
      arrNodes.push(nodeInfo);
    } else {
      let edgeInfo = {
        id: e.id,
        type: e.type,
        sourceId: 'ncbigene:5597',  // To Do
        targetId: 'ncbigene:207'
      };
      arrEdges.push(edgeInfo);
    }
  }
  /*let arrNodes = [{ id: 'ncbigene:5597', name: 'MAPK6' }, { id: 'ncbigene:207', name: 'AKT' }];
  let arrEdges =
    [{
      id: '01ef22cc-2a8e-46d4-9060-6bf1c273869b', type: 'phosphorylation',
      sourceId: 'ncbigene:5597', targetId: 'ncbigene:207',
      xref: 'a896d611-affe-4b45-a5e1-9bc560ffceab', doi: '10.1126/sciadv.abi6439',
      pmid: '34767444', articleTitle: '"MAPK6-AKT signaling promotes tumor growth and resistance to mTOR kinase blockade."'
    }];*/


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
