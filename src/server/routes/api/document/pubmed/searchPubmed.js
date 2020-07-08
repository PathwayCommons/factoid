import _ from 'lodash';
import queryString from 'query-string';
import fetch from 'node-fetch';

import { NCBI_EUTILS_BASE_URL, NCBI_EUTILS_API_KEY,
  EMAIL_FROM_ADDR, BASE_URL,
  CROSSREF_API_BASE_URL, PMC_ID_API_URL } from '../../../../../config';
import { checkHTTPStatus } from '../../../../../util';
import { ID_TYPE } from './index';

// const CROSSREF_API_BASE_URL = `https://api.crossref.org`;
const CROSSREF_WORKS_URL = `${CROSSREF_API_BASE_URL}/works`;

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

const safeFetch = url => {
  const userAgent = `${process.env.npm_package_name}/${process.env.npm_package_version}`;
  return fetch( url, {
    method: 'GET',
    headers: {
      'User-Agent': userAgent
    }
  })
  .then( checkHTTPStatus ) // HTTPStatusError
  .then( response => response.json() );
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
  return safeFetch( url )
    .then( checkEsearchResult ) // Error (programmatic)
    .then( pubmedDataConverter );
};

/**
 * Search for an article using Pubmed and CrossRef
 *
 * This approach uses a multi-stage approach:
 *   1. Query the PubMed EUTIL service
 *   2. If no unique hit, query Crossref API works resource component
 *   3. Send the CrossRef-derived DOI to PMC to map to a PMID
 *   4. If no PMID, try the Pubmed EUTILS service with DOI
 *
 * @param {String} term The search term to find the article (e.g. title)
 * @param {String} IdType One of ID_TYPE
 * @param {Object} opts Pubmed API options
 * @returns {Object} A Pubmed search result object
 */
const crSearchPubmed = async ( term, IdType, opts ) => {

  // try PubMed ESEARCH
  const queryOpts = IdType === ID_TYPE.TITLE ? { field: ID_TYPE.TITLE } : {};
  const searchResponse = await eSearchPubmed( term, queryOpts );
  if( searchResponse.count === -1 ){
    return searchResponse;

  } else {
    // try looking in CrossRef
    const { DOI } = await crSearch( term, IdType );
    const pmid = await getPmidFromDoi( DOI );

    if( pmid ){
      return {
        searchHits: [ pmid ],
        count: 1,
        query_key: null,
        webenv: null
      };
    } else {
      // Use the cr doi on PubMed
      return await eSearchPubmed( DOI, opts );
    }
  }
};

/**
 * Search for an article within the Crossref 'works' resource component
 * See {@link https://github.com/CrossRef/rest-api-doc docs}
 * @async
 * @param {String} term The search term
 * @param {String} IdType One of ID_TYPE
 * @returns {Object} The work item (top search hit when IdType !== DOI)
 */
const crSearch = async ( term, IdType ) => {
  let crUrl, pathToItem;

  if( IdType === ID_TYPE.DOI ){
    crUrl = `${CROSSREF_WORKS_URL}/${term}`;
    pathToItem = ['message'];
  } else {
    crUrl = CROSSREF_WORKS_URL + '?' + queryString.stringify( { 'query.bibliographic': term } );
    pathToItem = ['message', 'items', 0];
  }

  const crJson = await safeFetch( crUrl );
  const doi = _.get( crJson, pathToItem );
  return doi;
};

/**
 * Use the PMC API to get the PMID for an article from the DOI.
 * @async
 * @param {String} doi The article's DOI
 * @returns {String} The article's PMID, null if not found (i.e. doesn't exist or pubmed flakes out)
 */
const getPmidFromDoi = async doi => {
  const params = {
    format: 'json',
    ids: doi,
    tool: BASE_URL,
    email: EMAIL_FROM_ADDR
  };

  const url = PMC_ID_API_URL + '?' + queryString.stringify( params );
  const json = await safeFetch( url );
  let pmid = _.get( json, ['records', 0, 'pmid'] );
  return pmid;
};

/**
 * searchPubmed
 * Query the PubMed database for matching UIDs.
 *
 * @param { String } q The query term
 * @param { String } IdType One of ID_TYPE
 * @param { Object } opts EUTILS ESEARCH options
 * @returns { Object } result The search results from PubMed
 * @returns { Array } result.searchHits A list of PMIDs
 * @returns { Number } result.count The number of searchHits containing PMIDs
 * @returns { String } result.query_key See {@link https://www.ncbi.nlm.nih.gov/books/NBK25499/#chapter4.ESearch|EUTILS docs }
 * @returns { String } result.webenv See {@link https://www.ncbi.nlm.nih.gov/books/NBK25499/#chapter4.ESearch|EUTILS docs }
 */
const searchPubmed = ( q, IdType, opts ) => crSearchPubmed( q, IdType, opts );

export { searchPubmed, pubmedDataConverter };