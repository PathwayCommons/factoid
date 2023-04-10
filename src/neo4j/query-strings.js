export const constraint = `CREATE CONSTRAINT FOR (x:Entity) REQUIRE x.id IS UNIQUE`;

export const makeNodeQuery =
    `MATCH (n:Entity {id: $id})
    WITH collect(n) AS nodes
    CALL apoc.lock.nodes(nodes)
    MERGE (n:Entity {id: $id})
    ON CREATE SET n.name = $name`;

export const makeEdgeQuery =
    `MATCH (x:Entity {id: $sourceId})
    MATCH (y:Entity {id: $targetId})
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

export const giveConnectedInfoByGeneId =
    `MATCH (n:Entity {id: $id})<-[r]-(m)
    RETURN n, r, m
    UNION
    MATCH (n:Entity {id: $id})-[r]->(m)
    RETURN n, r, m`;

export const giveConnectedInfoByGeneIdNoComplexes =
    `MATCH (n:Entity {id: $id})<-[r]-(m)
    WHERE r.component = [] AND r.sourceComplex = '' AND r.targetComplex = ''
    RETURN n, r, m
    UNION
    MATCH (n:Entity {id: $id})-[r]->(m)
    WHERE r.component = [] AND r.sourceComplex = '' AND r.targetComplex = ''
    RETURN n, r, m`;

export const giveConnectedInfoForDocument =
    `MATCH (n)-[r {xref: $id}]->(m)
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