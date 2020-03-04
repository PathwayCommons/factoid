import _ from 'lodash';
import { URL } from 'url';

import { fetchPubmed } from './fetchPubmed';
import demoPubmedArticle from './demoPubmedArticle';
import { searchPubmed } from './searchPubmed';
import logger from '../../../../logger';
import { ArticleIDError } from '../../../../../util/pubmed';

import {
  PUBMED_LINK_BASE_URL,
  DEMO_ID
} from '../../../../../config';

const digitsRegex = /^[0-9.]+$/;

/**
 * findPubmedId
 *
 * Try to extract out a PMID from the input, which can be:
 *   1. number (including period(s))
 *   2. PubMed url, such as an article path (/123345) or search (e.g. /?term=title)
 *   3. a text query (e.g. title)
 * Will throw an 'ArticleIDError' if 1 and 2 do not apply and a PubMed search does
 * not return a unique result. This function is necessary because it polyfills
 * capabilities in EUTILS that are through  the PubMed website.
 *
 * @param {string} paperId the description of an article
 * @returns {string} the candidate uid
 * @throws {ArticleIDError} if it cannot identify a non-emptu, unique record
 */
const findPubmedId = async paperId => {

  let id;
  const getUniqueIdOrThrow = async query => {
    const { searchHits, count } = await searchPubmed( query );
    if( count === 1 ){
      return _.first( searchHits );
    } else {
      throw new ArticleIDError( 'Unrecognized paperId', paperId );
    }
  };
  const isUidLike = digitsRegex.test( paperId );

  if( isUidLike ){
    // Case: a bunch of digits, periods
    id = paperId;

  } else {
    const isPubMedUrlLike = paperId.startsWith( PUBMED_LINK_BASE_URL );

    if( isPubMedUrlLike ) {
      // Case: URL, look for path or exact search term
      const pubmedUrl = new URL( PUBMED_LINK_BASE_URL );
      const paperIdUrl = new URL( paperId );
      const isSameHost = paperIdUrl.hostname === pubmedUrl.hostname;
      const pathUidMatchResult = paperIdUrl.pathname.match( /^\/pubmed\/([0-9.]+)$/ );

      if( isSameHost && !_.isNull( pathUidMatchResult ) ){
        id = pathUidMatchResult[1];

      } else {
        const paperIdUrlSearchTerm = paperIdUrl.searchParams.get('term');

        if( isSameHost && paperIdUrlSearchTerm ) {
          id = await getUniqueIdOrThrow( paperIdUrlSearchTerm );
        }
      }

    } else {
      //Last bucket - do a search (title, doi, ...)
      id = await getUniqueIdOrThrow( paperId );
    }
  }

  return id;
};

/**
 * getPubmedRecord
 *
 * Retrieve a single PubmedArticle. Shall interpret an input as either:
 *   - A number (with optional period)
 *   - A url
 *     - with an PubMed article path e.g. 'https://www.ncbi.nlm.nih.gov/pubmed/123456'
 *     - with an PubMed search query.g. 'https://www.ncbi.nlm.nih.gov/pubmed/?term=123456'
 *     - A search returning a unique PubMed ID
 *
 * @param {string} paperId Contains or references a single PubMed uid (see above). If 'demo' return canned demo data.
 * @return {Object} The unique PubMedArticle (see [NLM DTD]{@link https://dtd.nlm.nih.gov/ncbi/pubmed/out/pubmed_190101.dtd} )
 */
const getPubmedArticle = async paperId => {
  if( paperId === DEMO_ID ){
    return demoPubmedArticle;

  } else {
    try {
      const candidateId = await findPubmedId( paperId );
      const { PubmedArticleSet } = await fetchPubmed({
        uids: [ candidateId ]
      });

      if( !_.isEmpty( PubmedArticleSet ) ){
        return _.head( PubmedArticleSet );
      } else {
        throw new ArticleIDError( 'No PubMed record found', paperId );
      }
    } catch ( e ) {
      // Error types to note: ArticleIDError, HTTPStatusError, FetchError
      logger.error( `Unable to retrieve a PubmedArticle for '${paperId}'` );
      logger.error( `${e.name}: ${e.message}` );
      throw e;
    }
  }
};

export { getPubmedArticle };