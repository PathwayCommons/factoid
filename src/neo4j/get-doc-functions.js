async function loadDoc(data, docSocket, eleSocket) {
    const { id, secret } = data;

    const doc = new Document({
        socket: docSocket,
        factoryOptions: { socket: eleSocket },
        data: { id, secret }
    });

    await doc.load();
    await doc.sync(true);

    return doc;
}

async function toDocs(docJSONs, docSocket, eleSocket) {
    const docPromises = docJSONs.map(async docJSON => await loadDoc(docJSON, docSocket, eleSocket));

    return Promise.all(docPromises);
}

async function getAllDocs() {// eslint-disable-line no-unused-vars
    const url = 'https://biofactoid.org/api/document/a896d611-affe-4b45-a5e1-9bc560ffceab';

    const res = await fetch(`${url}`);
    const docJSONs = await res.json();
    return await toDocs(docJSONs, this.docSocket, this.eleSocket);
}