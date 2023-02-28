import { addNode, addEdge } from './neo4j-functions';

// Remember that when using this function, call initDriver() sometime before 
//   and closeDriver() sometime later
export async function addDocumentToNeo4j() {
  // Step 1: Sort each element in a document into one of two categories
  //              a. Node/Gene
  //              b. Edge/Interaction
  let arrNodes = [{ id: 'ncbigene:5597', name: 'MAPK6' }, { id: 'ncbigene:207', name: 'AKT' }];
  let arrEdges =
    [{
      id: '01ef22cc-2a8e-46d4-9060-6bf1c273869b', type: 'phosphorylation',
      sourceId: 'ncbigene:5597', targetId: 'ncbigene:207',
      xref: 'a896d611-affe-4b45-a5e1-9bc560ffceab', doi: '10.1126/sciadv.abi6439',
      pmid: '34767444', articleTitle: 'MAPK6-AKT signaling promotes tumor growth and resistance to mTOR kinase blockade.'
    }];

  // Step 2: Make all the nodes
  for (let i = 0; i < arrNodes.length; i++) {
    let node = arrNodes[i];
    await addNode(node.id, node.name);
  }

  // Step 3: Make all the edges
  for (let i = 0; i < arrEdges.length; i++) {
    let edge = arrEdges[i];
    await addEdge(edge.id, edge.type, edge.sourceId, edge.targetId,
      edge.xref, edge.doi, edge.pmid, edge.articleTitle);
  }

}
