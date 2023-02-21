export const makeNodeQuery =
    `MERGE (gene:Gene {id: $id})
    ON CREATE SET gene.name = $name`;

export const makeRelationshipQuery =
    `MATCH (x:Gene {id: $sourceId})
    MATCH (y:Gene {id: $targetId})
    MERGE (x)-[r:INTERACTION {id: $id}]->(y)
    ON CREATE SET r.type = $type,
    r.xref = $xref,
    r.doi = $doi, 
    r.pmid = $pmid,
    r.articleTitle = $articleTitle,
    r.sourceId = $sourceId,
    r.targetId = $targetId`;

export const giveConnectedInfoByGeneId =
    `MATCH (n:Gene {id: $id})<-[r]-(m)
    RETURN n, r, m
    UNION
    MATCH (n:Gene {id: $id})-[r]->(m)
    RETURN n, r, m`;

export const returnGeneNameById =
    `MATCH (n {id: $id}) 
    RETURN n.name AS name`;

export const returnEdgeById =
    `MATCH(n)-[r {id: $id}]->(m)
    RETURN r`;

export const deleteAll = `MATCH (n) DETACH DELETE n`;

export const numNodes = `MATCH (n) RETURN COUNT(*) as count`;

export const numEdges = `MATCH (n)-[r]->(m) RETURN COUNT(r) as count`;