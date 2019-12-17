import _ from 'lodash';
import { URL } from 'url';
import { fetchPubmed } from './fetchPubmed';
import demoPubmedArticle from './demoPubmedArticle';
import { searchPubmed } from './searchPubmed';

import {
  PUBMED_LINK_BASE_URL,
  DEMO_ID
} from '../../../../../config';

const digitsRegex = /^[0-9.]+$/;

const findPubmedId = async paperId => {

  let id;
  const errMessage = `Unrecognized paperId '${paperId}'`;
  if( !_.isString( paperId ) ) throw new TypeError( errMessage );
  const isUidLike = digitsRegex.test( paperId );
  const isPubMedUrlLike = paperId.startsWith( PUBMED_LINK_BASE_URL );
  
  if( isUidLike ){
    id = paperId;
    
  } else if( isPubMedUrlLike ){
    const pubmedUrl = new URL( PUBMED_LINK_BASE_URL );
    const paperIdUrl = new URL( paperId );
    const isSameHost = paperIdUrl.hostname === pubmedUrl.hostname;
    
    const pathUidMatchResult = paperIdUrl.pathname.match( /^\/pubmed\/(\d+)$/ );
    const paperIdUrlSearchTerm = paperIdUrl.searchParams.get('term');
    
    if( isSameHost && !_.isNull( pathUidMatchResult ) ){
      id = pathUidMatchResult[1];
      
    } else if( isSameHost && paperIdUrlSearchTerm ) {
      const { searchHits, count } = await searchPubmed( paperIdUrlSearchTerm );
      if( count === 1 ){ 
        id = _.first( searchHits );
      } else {
        throw new TypeError( errMessage );
      }
      
    } else {
      throw new TypeError( errMessage );
    }
    
  } else {
    throw new TypeError( errMessage );
  }

  return id;
};

/**
 * getPubmedRecord
 * 
 * Retrieve a single PubmedArticle. Shall interpret an input as either: 
 *   - A set of digits 
 *   - A url 
 *     - Containing a set of digits e.g. 'https://www.ncbi.nlm.nih.gov/pubmed/123456'
 *     - A search returning a single PubMed UID 
 * 
 * @param {String} paperId Contains or references a single PubMed uid (see above). If 'demo' return canned demo data.
 * @return {Object} The unique PubMedArticle (see [NLM DTD]{@link https://dtd.nlm.nih.gov/ncbi/pubmed/out/pubmed_190101.dtd} )
 * @throws {TypeError} When paperId falls outside of the above cases
 */
const getPubmedArticle = async paperId => { 
  if( paperId === DEMO_ID ) return demoPubmedArticle;
  const candidateId = await findPubmedId( paperId );
  const { PubmedArticleSet } = await fetchPubmed({
    uids: [ candidateId ]
  });

  if( !_.isEmpty( PubmedArticleSet ) ){
    return _.head( PubmedArticleSet );
  } else {
    throw new Error( `No PubMed record for '${paperId}'` );
  }
};

export { getPubmedArticle }; 