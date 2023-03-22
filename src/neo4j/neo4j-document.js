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

function makeComponent(complex, doc) {
  const component = [];
  for (const entry of complex.elements()) {
    component.push(convertUUIDtoId(doc, entry.id()));
  }
  return component;
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
  let docElements = doc.elements();
  for (const e of docElements) {
    if (e.isEntity() && !e.isComplex()) {
      let nodeInfo = {
        id: `${e.association().dbPrefix}:${e.association().id}`,
        name: e.association().name
      };
      arrNodes.push(nodeInfo);
    } else if (e.isEntity && e.isComplex()) {
      // TODO: Push on the edges that will represent this complex e in arrEdges
      // Untested
      const complex = e;
      const component = makeComponent(complex, doc);
      for (let i = 0; i < complex.elements.length - 2; i++) {
        for (let j = i + 1; j < complex.elements().length - 1; j++) {
          const sourceUUId = complex.elements()[i].id();
          const targetUUId = complex.elements()[j].id();
          const edgeInfo = {
            id: complex.id(),
            type: complex.type(),
            component: component,
            sourceId: convertUUIDtoId(doc, sourceUUId),
            targetId: convertUUIDtoId(doc, targetUUId),
            sourceComplex: 'N/A',
            targetComplex: 'N/A'
          };
          arrEdges.push(edgeInfo);
        }
      }
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
        // TESTED
        edgeInfo = {
          id: e.id(),
          type: e.type(),
          component: [],
          sourceId: convertUUIDtoId(doc, sourceUUId),
          targetId: convertUUIDtoId(doc, targetUUId),
          sourceComplex: 'N/A',
          targetComplex: 'N/A'
        };
      } else if (source.isComplex() && !target.isComplex()) {
        // sourceUUID is a complex and targetUUID is a noncomplex
        const sourceComplex = doc.get(sourceUUId);

        for (let i = 0; i < sourceComplex.elements().length - 1; i++) {
          const complexElementSourceUUId = sourceComplex.elements()[i].id();
          const edgeInfo = {
            id: e.id(),
            type: e.type(),
            component: [],
            sourceId: convertUUIDtoId(doc, complexElementSourceUUId),
            targetId: convertUUIDtoId(doc, targetUUId),
            sourceComplex: sourceComplex.id(),
            targetComplex: 'N/A'
          };
          arrEdges.push(edgeInfo);
        }
      } else if (!source.isComplex() && target.isComplex()) {
        // sourceUUID is a noncomplex and targetUUID is a complex
        const targetComplex = doc.get(targetUUId);

        for (let i = 0; i < targetComplex.elements().length - 1; i++) {
          const complexElementTargetUUId = targetComplex.elements()[i].id();
          const edgeInfo = {
            id: e.id(),
            type: e.type(),
            component: [],
            sourceId: convertUUIDtoId(doc, sourceUUId),
            targetId: convertUUIDtoId(doc, complexElementTargetUUId),
            sourceComplex: 'N/A',
            targetComplex: targetComplex.id()
          };
          arrEdges.push(edgeInfo);
        }
      } else {
        // TODO: sourceUUID is a complex and targetUUID is a complex
        const sourceComplex = doc.get(sourceUUId);
        const targetComplex = doc.get(targetUUId);

        for (let i = 0; i < sourceComplex.elements().length - 1; i++) {
          for (let j = 0; j < targetComplex.elements().length - 1; j++) {
            const complexElementSourceUUId = sourceComplex.elements()[i].id();
            const targetElementSourceUUId = targetComplex.elements()[i].id();
            const edgeInfo = {
              id: e.id(),
              type: e.type(),
              component: [],
              sourceId: convertUUIDtoId(doc, complexElementSourceUUId),
              targetId: convertUUIDtoId(doc, targetElementSourceUUId),
              sourceComplex: sourceComplex.id(),
              targetComplex: targetComplex.id()
            };
            arrEdges.push(edgeInfo);
          }
        }
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
    await addEdge(edge.id, edge.type, edge.component, edge.sourceId, edge.targetId, edge.sourceComplex, edge.targetComplex,
      docCitations.xref, docCitations.doi, docCitations.pmid, docCitations.articleTitle);
  }

  return;
}
