// Format of node data are as follows:
// { id: 'element.association.dbPrefix'+ ':' + 'element.association.id', factoidId: 'element.id',
// name: 'element.name', type: 'element.type', dbId: 'element.association.id',
// dbName: "element.association.dbName"}
export const nodeData = [
    // MAPK6 data
    {
        id: 'ncbigene:5597', factoidId: '598f8bef-f858-4dd0-b1c6-5168a8ae5349', name: 'MAPK6',
        type: 'protein', dbId: '5597', dbName: 'NCBI Gene'
    },
    // AKT data
    {
        id: 'ncbigene:207', factoidId: '4081348e-20b8-4bf8-836f-695827a4f9a2', name: 'AKT',
        type: 'protein', dbId: '207', dbName: 'NCBI Gene'
    }
];

// Parameters of relationshipData are as follows:
// { id1: 'element.association.dbPrefix'+ ':' + 'element.association.id',
// id2: 'element.association.dbPrefix'+ ':' + 'element.association.id', id3: 'element.id',
// type: 'element.type', doi: 'value.citation.doi',
// pmid: 'value.citation.pmid', documentId: 'value.id', title: 'value.citation.title'}
export const relationshipData = [
    {
        id1: 'ncbigene:5597', id2: 'ncbigene:207', id3: '01ef22cc-2a8e-46d4-9060-6bf1c273869b',
        type: 'phosphorylation', doi: '10.1126/sciadv.abi6439', pmid: '34767444',
        documentId: 'a896d611-affe-4b45-a5e1-9bc560ffceab',
        title: 'MAPK6-AKT signaling promotes tumor growth and resistance to mTOR kinase blockade.'
    }
];
