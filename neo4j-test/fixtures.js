import r from 'rethinkdb';
import _ from 'lodash';
import path from 'path';
import { writeFile } from 'fs/promises';

// ****** Customized variables **********
// Document ID list to retrieve
const DOC_IDS = [
  'df9348dc-2126-45ff-a379-138b5589bcc8',
  '8a33f76c-802e-4df2-8f1e-0a94ab3fc735'
];
const FILENAME = 'doct_tests_1.json';

/**
 * makeFixture
 *
 * Use this file to create text fixtures
 *
 * Customize:
 *   - DOC_IDS: The list of Document IDs you want to retrieve
 *   - FILENAME: The name of the output file
 *
 * Run
 *   node -r esm neo4j-test/fixtures.js
 *
 * Output
 *   File JSON with schema { document: [...], element: [...] }
 */
async function makeFixture () {

  let conn;
  let db;

  const dbName = 'factoid';
  const dbTables = ['document', 'element'];

  try {
    // Connect to db
    conn = await r.connect({ host: 'localhost', db: dbName });
    db = r.db(dbName);
    let loadTable = name => ({ rethink: r, conn, db, table: db.table(name) });
    let loadTables = () => Promise.all(dbTables.map(loadTable)).then(dbInfos => ({ docDb: dbInfos[0], eleDb: dbInfos[1] }));
    const { docDb, eleDb } = await loadTables();

    let document = await getDocs( DOC_IDS, docDb );
    let element = await getElts( DOC_IDS, docDb, eleDb );

    return {
      document,
      element
    };

  } catch (err) {
    console.error(`Error: ${err}`);
    throw err;

  } finally {
    await conn.close();

  }
}

async function getElts( ids, docDb, eleDb ){
  const redactElt = elt => _.assign( {}, elt, {
    secret: 'read-only',
    _ops: []
  });

  // Retrieve records
  let q = docDb.table
    .getAll( r.args( ids ) )
    .map( function( document ){
      return document.merge({ entries: document( 'entries' )( 'id' ) });
    })
    .merge( function( document ) {
      return {
        elements: eleDb.table
          .getAll( r.args( document( 'entries' ) ) )
          .coerceTo( 'array' )
      };
    })
    .map(function(val){
      return val('elements');
    });

  const cursor = await q.run( docDb.conn );
  const raw = _.flatten( await cursor.toArray() );
  const elts = raw.map( redactElt );

  return elts;
}

async function getDocs( ids, { conn, table } ){
  const redactDoc = doc => _.assign( {}, doc, {
    secret: 'read-only',
    _ops: [],
    correspondence: {
      authorEmail: [],
      emails: []
    },
    provided: {
      authorEmail: 'user@email.org',
      authorName: 'John Doe',
      name: 'John Doe',
      paperId: 'Some paper id'
    },
    tweet: null
  });

  // Retrieve records
  let q = table.getAll( r.args( ids ) );
  const cursor = await q.run( conn );
  const raw = await cursor.toArray();

  // Process records
  const docs = raw.map( redactDoc );
  return docs;
}

async function writeData(data){
  const OUT_FILE = path.join(__dirname, FILENAME);
  const formatJSON = d => JSON.stringify(d, null, 2);
  await writeFile(OUT_FILE, formatJSON(data));
}

// Run this
makeFixture().then( writeData );

