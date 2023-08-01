import _ from 'lodash';
import queryString from 'query-string';
import fetch from 'node-fetch';

import { CROSSREF_API_BASE_URL, EMAIL_ADDRESS_INFO, BASE_URL } from '../../../../../config.js';
import { checkHTTPStatus } from '../../../../../util/index.js';

const WORKS_URL = CROSSREF_API_BASE_URL + 'works';

const toJson = response => response.json();
const checkResultStatus = json => {
  const status = _.get( json, ['status'] );
  const isOK = status === 'ok';
  if( isOK ){
    return json;
  } else {
    const message = _.get( json, ['message'] );
    throw new Error(`${message}`);
  }
};

/**
 * search
 *
 * Query the CrossRef web service API for matching Work.
 * [See docs]{@link https://api.crossref.org/swagger-ui/index.html#/Works/get_works}
 *
 * @param { String } q The query term
 * @param { Object } opts Search options
 * @returns { Object } result The search results
 * @returns { Array } result.searchHits A list of matching records
 * @returns { Number } result.count The number of searchHits
 */
const search = (q, opts) => {
  const DEFAULT_WORKS_PARAMS = {
    'query.bibliographic': undefined, //query field for: citation look up, includes titles, authors, ISSNs and publication years
    'rows': 5
  };
  const formatSearchHits = json => {
    const searchHits =  _.get( json, ['message', 'items'] );
    const count = searchHits.length;
    return { searchHits, count };
  };
  const params = _.assign( {}, DEFAULT_WORKS_PARAMS, { 'query.bibliographic': q }, opts );
  const url = WORKS_URL + '?' + queryString.stringify( params );
  const userAgent = `${process.env.npm_package_name}/${process.env.npm_package_version} (${BASE_URL}; mailto:${EMAIL_ADDRESS_INFO})`;
  return fetch( url, {
    method: 'GET',
    headers: {
      'User-Agent': userAgent
    }
  })
  .then( checkHTTPStatus )
  .then( toJson )
  .then( checkResultStatus )
  .then( formatSearchHits );
};


/**
 * get
 *
 * Retrieve Work from CrossRef web service API.
 * [See docs]{@link https://api.crossref.org/swagger-ui/index.html#/Works/get_works__doi_}
 *
 * @param { String } doi The object DOI
 * @returns { Object } The matching record
 */
const get = doi => {
  const formatGetResponse = json => _.get( json, ['message'] );
  const url = WORKS_URL + `/${doi}`;
  const userAgent = `${process.env.npm_package_name}/${process.env.npm_package_version} (${BASE_URL}; mailto:${EMAIL_ADDRESS_INFO})`;
  return fetch( url, {
    method: 'GET',
    headers: {
      'User-Agent': userAgent
    }
  })
  .then( checkHTTPStatus )
  .then( toJson )
  .then( checkResultStatus )
  .then( formatGetResponse );
};

export { search, get };