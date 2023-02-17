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
    r.articleTitle = $articleTitle`;

export const giveConnectedInfoByGeneId =
    `MATCH (n:Gene {id: $id})<-[r]-(m)
    RETURN n, r, m
    UNION
    MATCH (n:Gene {id: $id})-[r]->(m)
    RETURN n, r, m`;

export const returnGeneNameById =
    `MATCH (n {id: $id}) 
    RETURN n.name AS name`;

export const returnEdgeTypeById =
    `MATCH(n)-[r {id: $id}]->(m) 
    RETURN r.type AS type`;

export const returnEdgeXrefById =
    `MATCH(n)-[r {id: $id}]->(m) 
    RETURN r.xref AS xref`;

export const returnEdgeDoiById =
    `MATCH(n)-[r {id: $id}]->(m) 
    RETURN r.doi AS doi`;

export const returnEdgePmidById =
    `MATCH(n)-[r {id: $id}]->(m) 
    RETURN r.pmid AS pmid`;

export const returnEdgeArticleTitleById =
    `MATCH(n)-[r {id: $id}]->(m) 
    RETURN r.articleTitle AS articleTitle`;

export const deleteAll = `MATCH (n) DETACH DELETE n`;

export const numNodes = `MATCH (n) RETURN COUNT(*) as count`;

export const numEdges = `MATCH (n)-[r]->(m) RETURN COUNT(r) as count`;