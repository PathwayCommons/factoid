import _ from 'lodash';
import queryString from 'query-string';
import fetch from 'node-fetch';
import { URLSearchParams } from 'url';

import { NCBI_EUTILS_BASE_URL, NCBI_EUTILS_API_KEY } from '../../../../../config';
import { checkHTTPStatus } from '../../../../../util';

const DEFAULT_MAX_PER_LINK = 50; // Take the top n from each category
const EUTILS_LINK_URL = NCBI_EUTILS_BASE_URL + 'elink.fcgi';
const DEFAULT_ELINK_PARAMS = {
  term: undefined,
  db: 'pubmed',
  dbfrom: 'pubmed',
  retmode: 'json',
  cmd: 'neighbor',
  api_key: NCBI_EUTILS_API_KEY,
  datetype: 'pdat',
  reldate: undefined,
  linkname: undefined
};

/**
 * elink2UidList
 * Retrieve PubMed uids from the ELINK response
 * @param {Object} json The ELINK response
 * @param {Object} linknames The list linknames to consider
 * @param {number} maxPerLink Take this top number of uids for any one subset (dbfrom_db_subset)
 * @return {Object} The array of PubMed uids
 */
const elink2UidList = ( json, linknames, maxPerLink = DEFAULT_MAX_PER_LINK ) => {
  let { ids, linksetdbs = [] } =  _.get( json, ['linksets', '0'] );
  if( linknames ) linksetdbs = linksetdbs.filter( linksetdb => _.includes( linknames, linksetdb.linkname ) );
  const links =  linksetdbs.map( linksetdb => _.take( _.get( linksetdb, ['links'] ), maxPerLink ) );
  let uids = _.flatten( links );
  uids = _.uniq( uids ); // Remove redundancy
  uids = _.pullAll( uids, ids ); // Remove the query uids
  return uids;
};

/**
 * eLink
 * Generic wrapper for NCBI ELINK EUTIL
 * @param {Object} opts The options for ELINK service(see [SML Dataguide]{@link https://dataguide.nlm.nih.gov/eutilities/utilities.html#elink} )
 */
const eLink = opts => {
  const url = EUTILS_LINK_URL;
  const userAgent = `${process.env.npm_package_name}/${process.env.npm_package_version}`;
  const params = _.defaults( {}, opts, DEFAULT_ELINK_PARAMS );
  const body = new URLSearchParams( queryString.stringify( params ) );
  return fetch( url, {
    method: 'POST',
    headers: {
      'User-Agent': userAgent
    },
    body
  })
  .then( checkHTTPStatus ) // HTTPStatusError
  .then( response => response.json() );
};

export { eLink, elink2UidList };