import _ from 'lodash';
import queryString from 'query-string';
import fetch from 'node-fetch';

import { NCBI_EUTILS_BASE_URL, NCBI_EUTILS_API_KEY } from '../../../../../config';
import { checkHTTPStatus } from '../../../../../util';

const EUTILS_SEARCH_URL = NCBI_EUTILS_BASE_URL + 'esearch.fcgi';
const DEFAULT_ESEARCH_PARAMS = {
  term: undefined,
  db: 'pubmed',
  rettype: 'uilist',
  retmode: 'json',
  retmax: 10,
  usehistory: 'y',
  field: undefined,
  api_key: NCBI_EUTILS_API_KEY
};

const pubmedDataConverter = json => {

  const esearchresult =  _.get( json, ['esearchresult'] );

  return {
    searchHits: _.get( esearchresult, ['idlist'], [] ),
    count: _.parseInt( _.get( esearchresult, ['count'], '0' ) ),
    query_key: _.get( esearchresult, ['querykey'], null ),
    webenv: _.get( esearchresult, ['webenv'], null )
  };
};

const checkEsearchResult = json => {
  const errorMessage =  _.get( json, ['esearchresult', 'ERROR'] );
  if( errorMessage ) throw new Error( errorMessage );
  return json;
};

const eSearchPubmed = ( term, opts ) => {
  const params = _.assign( {}, DEFAULT_ESEARCH_PARAMS, { term }, opts );
  const url = EUTILS_SEARCH_URL + '?' + queryString.stringify( params );
  const userAgent = `${process.env.npm_package_name}/${process.env.npm_package_version}`;
  return fetch( url, {
    method: 'GET',
    headers: {
      'User-Agent': userAgent
    }
  })
  .then( checkHTTPStatus ) // HTTPStatusError
  .then( response => response.json() )
  .then( checkEsearchResult ) // Error (programmatic)
  .then( pubmedDataConverter );
};

/**
 * searchPubmed
 * Query the PubMed database for matching UIDs.
 *
 * @param { String } q The query term
 * @param { Object } opts EUTILS ESEARCH options
 * @returns { Object } result The search results from PubMed
 * @returns { Array } result.searchHits A list of PMIDs
 * @returns { Number } result.count The number of searchHits containing PMIDs
 * @returns { String } result.query_key See {@link https://www.ncbi.nlm.nih.gov/books/NBK25499/#chapter4.ESearch|EUTILS docs }
 * @returns { String } result.webenv See {@link https://www.ncbi.nlm.nih.gov/books/NBK25499/#chapter4.ESearch|EUTILS docs }
 */
const searchPubmed = ( q, opts ) => eSearchPubmed( q, opts );

export { searchPubmed, pubmedDataConverter };