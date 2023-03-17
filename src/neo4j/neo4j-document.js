import { addNode, addEdge } from './neo4j-functions';

/**
 * @param { Document } doc : document model instance
 * @param { String } id : UUID of an entity element in doc
 * @returns string in the form of dbname:id (ex. 'ncbigene:207') if entity element
 *            if found, 'node not found' otherwise
 */
export function convertUUIDtoId(doc, id) {
  let node = doc.get(id);
  if (node) {
    return `${node.association().dbPrefix}:${node.association().id}`;
  }
  return 'node not found';
}

/**
 * addDocumentToNeo4j takes a Document as a parameter and creates the associated nodes 
 * and edges in a Neo4j database
 * @param { Document } doc : a document model instance
 * @returns 
 */
export async function addDocumentToNeo4j(doc) {

  // Step 1: Sort each element in a document into one of two categories
  //              a. Node/Gene
  //              b. Edge/Interaction
  let arrNodes = [];
  let arrEdges = [];
  let arrComplexEdges = []; // Edges establishing a complex
  let arrComplexInteractionEdges = []; // interactions between 1 or more complexes

  let docElements = doc.elements();
  for (const e of docElements) {
    if (e.isEntity() && !e.isComplex()) {
      let nodeInfo = {
        id: `${e.association().dbPrefix}:${e.association().id}`,
        name: e.association().name
      };
      arrNodes.push(nodeInfo);
    } else if (e.isEntity && e.isComplex()) {
      let numEdgesNeeded = e.elements().length;

      // TO DO: make a complex

    } else {
      let sourceUUId;
      let targetUUId;
      if (e.association().getSource()) {
        sourceUUId = e.association().getSource().id();
        targetUUId = e.association().getTarget().id();
      } else { // if getSource() is null, this interaction is undirected
        sourceUUId = e.elements()[0].id();
        targetUUId = e.elements()[1].id();
      }

      let source = doc.get(sourceUUId);
      let target = doc.get(targetUUId);

      let edgeInfo;
      if (!source.isComplex() && !target.isComplex()) {
        edgeInfo = {
          id: e.id(),
          type: e.type(),
          sourceId: convertUUIDtoId(doc, sourceUUId),
          targetId: convertUUIDtoId(doc, targetUUId),
          participantTypes: 'noncomplex-to-noncomplex'
        };
      } else if (source.isComplex() && !target.isComplex()) {
        // TODO: sourceUUID is a complex and targetUUID is a noncomplex

      } else if (!source.isComplex() && target.isComplex()) {
        // TODO: sourceUUID is a noncomplex and targetUUID is a complex

      } else {
        // TODO: sourceUUID is a complex and targetUUID is a complex

      }
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
  for (const node of arrNodes) {
    await addNode(node.id, node.name);
  }

  // Step 3: Make all the edges
  for (const edge of arrEdges) {
    await addEdge(edge.id, edge.type, edge.sourceId, edge.targetId, edge.participantTypes,
      docCitations.xref, docCitations.doi, docCitations.pmid, docCitations.articleTitle);
  }

  return;
}
