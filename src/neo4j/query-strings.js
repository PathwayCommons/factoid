export const makeNodeQuery =
    `MERGE (n:Molecule {id: $id})
    ON CREATE SET n.name = $name`;

export const makeEdgeQuery =
    `MATCH (x:Molecule {id: $sourceId})
    MATCH (y:Molecule {id: $targetId})
    MERGE (x)-[r:INTERACTION {id: $id}]->(y)
    ON CREATE SET r.type = $type,
    r.component = $component,
    r.sourceId = $sourceId,
    r.targetId = $targetId,
    r.sourceComplex = $sourceComplex,
    r.targetComplex = $targetComplex,
    r.xref = $xref,
    r.doi = $doi, 
    r.pmid = $pmid,
    r.articleTitle = $articleTitle`;

export const makeComplexEdgeQuery = 
    `MATCH (x:Molecule {id: $sourceId})
    MATCH (y:Molecule {id: $targetId})
    MERGE (x)-[r:COMPLEX {id: $id}]->(y)
    ON CREATE SET r.allParticipants = $allParticipants`;

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

export const returnEdgeByIdAndEndpoints =
    `MATCH(n {id: $sourceId})-[r {id: $complexId}]->(m {id: $targetId})
    RETURN r`;

export const deleteAll = `MATCH (n) DETACH DELETE n`;

export const numNodes = `MATCH (n) RETURN COUNT(*) as count`;

export const numEdges = `MATCH (n)-[r]->(m) RETURN COUNT(r) as count`;