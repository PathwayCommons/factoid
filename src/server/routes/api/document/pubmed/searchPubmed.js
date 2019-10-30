import _ from 'lodash';
// import queryString from 'query-string';

// import { NCBI_EUTILS_BASE_URL } from '../../../../../config';

// const EUTILS_SEARCH_URL = NCBI_EUTILS_BASE_URL + 'esearch.fcgi';
// const DEFAULT_ESEARCH_PARAMS = {
//   term: undefined,
//   db: 'pubmed',
//   rettype: 'uilist'
//   retmode: 'json',
//   retmax: 10,
//   usehistory: 'y',
//   field: undefined
// };

const pubmedDataConverter = json => {

  const esearchresult =  _.get( json, ['esearchresult'] );

  const data = {
    searchHits: _.get( esearchresult, ['idlist'], [] ),
    count: _.parseInt( _.get( esearchresult, ['count'], '0' ) ),
    query_key: _.get( esearchresult, ['querykey'], null ),
    webenv: _.get( esearchresult, ['webenv'], null )
  };

  return data;
};

const eSearchPubmed = term => term;

const searchPubmed = q => eSearchPubmed( q );

export { searchPubmed, pubmedDataConverter };