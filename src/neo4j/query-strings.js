export const makeNodeQuery =
    `MERGE (n:Molecule {id: $id})
    ON CREATE SET n.name = $name`;

export const makeRelationshipQuery =
    `MATCH (x:Molecule {id: $sourceId})
    MATCH (y:Molecule {id: $targetId})
    MERGE (x)-[r:INTERACTION {id: $id}]->(y)
    ON CREATE SET r.type = $type,
    r.xref = $xref,
    r.doi = $doi, 
    r.pmid = $pmid,
    r.articleTitle = $articleTitle,
    r.sourceId = $sourceId,
    r.targetId = $targetId`;

export const giveConnectedInfoByGeneId =
    `MATCH (n:Molecule {id: $id})<-[r]-(m)
    RETURN n, r, m
    UNION
    MATCH (n:Molecule {id: $id})-[r]->(m)
    RETURN n, r, m`;

export const returnGene =
    `MATCH (n {id: $id}) 
    RETURN n`;

export const returnEdgeById =
    `MATCH(n)-[r {id: $id}]->(m)
    RETURN r`;

export const deleteAll = `MATCH (n) DETACH DELETE n`;

export const numNodes = `MATCH (n) RETURN COUNT(*) as count`;

export const numEdges = `MATCH (n)-[r]->(m) RETURN COUNT(r) as count`;