import fetch from 'node-fetch';

import { tryPromise } from '../util/promise';
import { checkHTTPStatus } from '../util/fetch';

function convertDocumentToBiopax(docId, baseUrl = '') {
  let SERVER_URL = baseUrl + `/api/document/biopax/${docId}`;
  let makeRequest = () => fetch(SERVER_URL);
  return tryPromise( makeRequest )
    .then( checkHTTPStatus )
    .then( result => result.text() );
}

function convertDocumentToTxt(docId, baseUrl = '') {
  let SERVER_URL = baseUrl + `/api/document/text/${docId}`;
  let makeRequest = () => fetch(SERVER_URL);
  return tryPromise( makeRequest )
          .then( checkHTTPStatus )
          .then( result => result.text() );
}

function convertDocumentToJson(docId, baseUrl = '') {
  let SERVER_URL = baseUrl + `/api/document/${docId}`;
  let makeRequest = () => fetch(SERVER_URL);
  return tryPromise( makeRequest )
          .then( checkHTTPStatus )
          .then( result => result.text() );
}

function convertDocumentToSbgn(docId, baseUrl = '') {
  let SERVER_URL = baseUrl + `/api/document/sbgn/${docId}`;
  let makeRequest = () => fetch(SERVER_URL);
  return tryPromise( makeRequest )
          .then( checkHTTPStatus )
          .then( result => result.text() );
}

export { convertDocumentToBiopax, convertDocumentToTxt, convertDocumentToJson, convertDocumentToSbgn };
