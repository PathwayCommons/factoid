// import _ from 'lodash';
// import queryString from 'query-string';

// import { NCBI_EUTILS_BASE_URL } from '../../../../../config';

// const EUTILS_SEARCH_URL = NCBI_EUTILS_BASE_URL + 'esearch.fcgi';
// const DEFAULT_ESEARCH_PARAMS = {
//   db: 'pubmed',
//   usehistory: 'y',
//   retmode: 'json',
//   term: undefined
// };

const pubmedDataConverter = json => json;

const eSearchPubmed = term => term;

const searchPubmed = q => eSearchPubmed( q );

export { searchPubmed, pubmedDataConverter };