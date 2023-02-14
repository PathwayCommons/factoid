export const makeNodeQuery =
    `MERGE (gene:Gene {id: $id})
    ON CREATE SET gene.name = $name`;

export const makeRelationshipQuery =
    `MATCH (x:Gene {id: $sourceId})
    MATCH (y:Gene {id: $targetId})
    MERGE (x)-[r:INTERACTION {id: $id}]->(y)
    ON CREATE SET r.type = $type,
    r.doi = $doi, 
    r.pmid = $pmid,
    r.factoidDocumentId = $factoidDocumentId,
    r.articleTitle = $articleTitle`;

export const giveInfoByGeneId = 
    `MATCH (n:Gene {id: $id})<-[r]-(m)
    RETURN n, r, m
    UNION
    MATCH (n:Gene {id: $id})-[r]->(m)
    RETURN n, r, m`;