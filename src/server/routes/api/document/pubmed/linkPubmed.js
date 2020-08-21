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

const data2UidList = ( json, maxPerLink ) => {
  const { ids, linksetdbs = [] } =  _.get( json, ['linksets', '0'] );
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

/**
 * db2pubmed
 * Retrieve PubMed uids for one or more uids from the source database
 * @param {Object} uids Array of strings that represent PubMed uids
 * @param {string} dbfrom The database (e.g. gene, protein) from which the uids are derived
 * @param {string} reldate Restrict to uids to those with Publication Date within the last n days
 * @param {string} term Text query used to limit the set of unique identifiers (UIDs) returned, similar to the search string you would put into an Entrez database’s web interface.
 * @param {number} maxPerLink Take this top number of uids for any one subset (dbfrom_db_subset)
 * @return {Object} The array of PubMed uids
 */
const db2pubmed = ({ uids, db, reldate, term, maxPerLink = DEFAULT_MAX_PER_LINK }) => {
  const id = uids.join(',');
  return  eLink( { id, dbfrom: db, reldate, term } )
    .then( data => data2UidList( data, maxPerLink ) );
};

export { eLink, db2pubmed };