import db from '../server/db.js';
import _ from 'lodash';
import fetch from 'node-fetch';
import Document from '../model/document';

// Goal: Be able to read in a document or list of documents and get
//          1) the id of the document (ex. 'a896d611-affe-4b45-a5e1-9bc560ffceab')
//          2) the pmid
//          3) the doi
//          4) the article title
//      These four items will be a property of each edge

//       For each Node/Gene element, get
//          1) dbPrefix (ex. 'ncbigene')
//          2) the id from that database, (ex. '207')
//          3) a name (ex. 'MAPK6')

//      For each Edge/Interaction element, get
//          1) element id (ex. '01ef22cc-2a8e-46d4-9060-6bf1c273869b')
//          2) type (ex. 'phosphorylation')
//          3) source id (gene the edge is pointing away from) 
//          4) target id (gene the edge is pointing to)
//          Note: In final product, source and target id should be in the form of 'ncbigene:207' or similar

export function newDoc({ docDb, eleDb, id, secret, provided }) {
    return new Document(_.assign({}, docDb, {
        factoryOptions: eleDb,
        data: _.assign({}, { id, secret, provided })
    }));
}

export async function createDoc({ docDb, eleDb, id, secret, provided }) {
    let doc = newDoc({ docDb, eleDb, id, secret, provided });

    return doc.create().then(() => doc);
}

export async function deleteDoc(doc) {
    let clearRows = (db, secret) => db.table.filter({ secret }).delete().run(db.conn);
    const { docDb, eleDb } = await loadTables();
    const elements = doc.elements();

    // delete doc
    const docSecret = doc.secret();
    await clearRows(docDb, docSecret);

    // delete elements
    const eleSecrets = elements.map(e => e.secret());
    await Promise.all(eleSecrets.map(s => clearRows(eleDb, s)));
}

let loadDoc = ({ docDb, eleDb, id, secret }) => {
    let doc = newDoc({ docDb, eleDb, id, secret });

    return doc.load().then(() => doc);
};

let tables = ['document', 'element'];

let loadTable = name => db.accessTable(name);

export async function loadTables() {
    return Promise.all(tables.map(loadTable)).then(dbInfos => ({
        docDb: dbInfos[0],
        eleDb: dbInfos[1]
    }));
}

async function toDocs(docJSONs) {
    const getID = docJSON => docJSON.id;
    const { docDb, eleDb } = await loadTables();
    const docPromises = docJSONs.map(getID).map(async id => await loadDoc({ docDb, eleDb, id }));

    return Promise.all(docPromises);
}

export async function getAllDocs() {
    // todo eventually replace with rethinkdb query because http requests are inefficient
    const url = 'http://localhost:3000/api/document/'; // my machine
    // const url = 'https://biofactoid.org/api/document/a896d611-affe-4b45-a5e1-9bc560ffceab';
    // const url = 'https://biofactoid.org/api/document/';

    const res = await fetch(`${url}`);
    const docJSONs = await res.json();
    return await toDocs(docJSONs);
}