export const makeNodeQuery =
    `MERGE (gene:Gene {id: $id})
    ON CREATE SET gene.factoidId = $factoidId, 
    gene.name = $name,
    gene.type = $type,
    gene.dbId = $dbId,
    gene.dbName = $dbName
    RETURN gene.name`;

export const makeRelationshipQuery =
    `MATCH (x:Gene {id: $id1})
    MATCH (y:Gene {id: $id2})
    MERGE (x)-[r:INTERACTION {id: $id3}]->(y)
    ON CREATE SET r.type = $type,
    r.doi = $doi, 
    r.pmid = $pmid,
    r.documentId = $documentId,
    r.title = $title`;

export const giveInfoByGeneId = 
    `MATCH (n:Gene {id: $id})<-[r]-(m)
    RETURN n, r, m
    UNION
    MATCH (n:Gene {id: $id})-[r]->(m)
    RETURN n, r, m`;