import _ from 'lodash';
import queryString from 'query-string';
import fetch from 'node-fetch';

import { NCBI_EUTILS_BASE_URL, NCBI_EUTILS_API_KEY, CROSSREF_API_BASE_URL, PMC_ID_API_URL } from '../../../../../config';
import { checkHTTPStatus } from '../../../../../util';

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
 * Search for an article using Crossref and return a Pubmed-style result.
 * 
 * This approach uses Crossref to find the article's DOI.  The DOI is sent to PMC to find a
 * PMID.  If the PMC query fails for any reason, a query to Pubmed Eutils is made using the 
 * DOI as the search term.  For some articles, PMC fails.  For others, Eutils fails.  Using
 * both gives good coverage.
 * 
 * @param {String} term The search term to find the article (e.g. title)
 * @param {Object} opts Pubmed API options
 * @returns {Object} A Pubmed search result object
 */
const crSearchPubmed = async ( term, opts ) => {
  const doi = await crSearchForDoi(term);

  const pmid = await getPmidFromDoi(doi);

  if( pmid ){
    return {
      searchHits: [ pmid ],
      count: 1,
      query_key: '-1',
      webenv: 'imitated_pubmed_format_from_crossref_query'
    };
  } else {
    return eSearchPubmed(doi, opts);
  }
};

/**
 * Search for an article's DOI using Crossref
 * @async
 * @param {String} term The search term (e.g. article title)
 * @returns {String} The DOI, null if not found
 */
const crSearchForDoi = async ( term ) => {
  const params = {
    'query.bibliographic': term
  };

  const crUrl = CROSSREF_WORKS_URL + '?' + queryString.stringify( params );

  const crRes = await fetch(crUrl, {
    method: 'GET'
  });

  const crJson = await crRes.json();

  const doi = _.get(crJson, ['message', 'items', 0, 'DOI']);

  return doi;
};

/**
 * Use the PMC API to get the PMID for an article from the DOI.
 * @async
 * @param {String} doi The article's DOI
 * @returns {String} The article's PMID, null if not found (i.e. doesn't exist or pubmed flakes out)
 */
const getPmidFromDoi = async ( doi ) => {
  const params = {
    format: 'json',
    ids: doi,
    tool: 'Biofactoid',
    email: 'info@biofactoid.org'
  };

  const url = PMC_ID_API_URL + '?' + queryString.stringify( params );

  const res = await fetch(url, {
    method: 'GET'
  });

  const json = await res.json();

  let pmid = _.get(json, ['records', 0, 'pmid']);

  return pmid;
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
const searchPubmed = ( q, opts ) => crSearchPubmed( q, opts );

export { searchPubmed, pubmedDataConverter };