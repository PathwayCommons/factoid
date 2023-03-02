import db from '../server/db.js';
import _ from 'lodash';
import fetch from 'node-fetch';
import Document from '../model/document';

let newDoc = ({ docDb, eleDb, id, secret, provided }) => {
    return new Document(_.assign({}, docDb, {
        factoryOptions: eleDb,
        data: _.assign({}, { id, secret, provided })
    }));
};

let loadDoc = ({ docDb, eleDb, id, secret }) => {
    let doc = newDoc({ docDb, eleDb, id, secret });

    return doc.load().then(() => doc);
};

let tables = ['document', 'element'];

let loadTable = name => db.accessTable(name);

let loadTables = () => Promise.all(tables.map(loadTable)).then(dbInfos => ({
    docDb: dbInfos[0],
    eleDb: dbInfos[1]
}));

async function toDocs(docJSONs) {
    const getID = docJSON => docJSON.id; // Fix this
    const { docDb, eleDb } = await loadTables();
    const docPromises = docJSONs.map(getID).map(async id => await loadDoc({ docDb, eleDb, id }));
    console.log("We have mapped");

    return Promise.all(docPromises);
}

export async function getAllDocs() {
    // todo eventually replace with rethinkdb query because http requests are inefficient
    const url = 'http://localhost:3000/api/document/'; // my machine
    // const url = 'https://biofactoid.org/api/document/a896d611-affe-4b45-a5e1-9bc560ffceab';
    // const url = 'https://biofactoid.org/api/document/';

    const res = await fetch(`${url}`);
    const docJSONs = await res.json();
    console.log("We have fetched");
    return await toDocs(docJSONs);
}