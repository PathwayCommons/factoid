import _ from 'lodash';
import { fetchPubmed } from './fetchPubmed';
import demoPubmedArticle from './demoPubmedArticle';
import { searchPubmed } from './searchPubmed';
import logger from '../../../../logger';
import { ArticleIDError, getPubmedCitation } from '../../../../../util/pubmed';
import {
  DEMO_ID
} from '../../../../../config';

const ID_TYPE = Object.freeze({
  DOI: 'doi',
  PMID: 'uid',
  TITLE: 'title'
});

// 99.3% of CrossRef DOIs (https://www.crossref.org/blog/dois-and-matching-regular-expressions/)
const doiRegex = /^10\.\d{4,9}\/[-._;()/:A-Z0-9]+$/i;
const digitsRegex = /^[0-9.]+$/;

const getUniqueArticleOrThrow = async ( query, IdType ) => {
  const queryOpts = IdType === ID_TYPE.TITLE ? { field: ID_TYPE.TITLE } : {};
  const { searchHits, count } = await searchPubmed( query, queryOpts );
  if( count === 1 ){
    return _.first( searchHits );
  } else {
    throw new ArticleIDError( `Unrecognized paperId '${query}'`, query );
  }
};

const findPubmedId = async paperId => {
  let IdType = ID_TYPE.TITLE;
  const isUidLike = digitsRegex.test( paperId );
  const isDoiLike = doiRegex.test( paperId );

  if( isDoiLike ) {
    IdType = ID_TYPE.DOI;
  } else if ( isUidLike ){
    IdType = ID_TYPE.PMID;
  }
  const foundId = await getUniqueArticleOrThrow( paperId, IdType );
  return { IdType, foundId };
};

/**
 * getPubmedRecord
 *
 * Retrieve a single PubmedArticle. Shall interpret an input as:
 *   1. Digital Object Identifier (doi)
 *   2. PubMed UID (pmid)
 *   3. The exact article title
 *   4. Keyword 'demo'
 * @param {string} paperId Contains or references a single PubMed uid (see above). If 'demo' return canned demo data.
 * @return {Object} The unique PubMedArticle (see [NLM DTD]{@link https://dtd.nlm.nih.gov/ncbi/pubmed/out/pubmed_190101.dtd} )
 */
const getPubmedArticle = async paperId => {
  if( paperId === DEMO_ID ){
    return demoPubmedArticle;

  } else {
    try {
      const { IdType, foundId } = await findPubmedId( paperId );
      const { PubmedArticleSet } = await fetchPubmed({
        uids: [ foundId ]
      });

      let hasMatch = false;
      const PubmedArticle = _.head( PubmedArticleSet );
      const { title, pmid, doi } = getPubmedCitation( PubmedArticle );
      // Pubmed EFETCH returns lower-cased title, adds trailing period
      const santitize = raw => {
        const trimmed = _.trim( raw , ' .');
        const lower = _.toLower( trimmed );
        const clean = lower.replace(/[\W_]+/g, ' ');
        return clean;
      };

      switch ( IdType ) {
        case ID_TYPE.DOI:
          if( doi === paperId ) hasMatch = true;
          break;
        case ID_TYPE.PMID:
          if( pmid === paperId ) hasMatch = true;
          break;
        case ID_TYPE.TITLE:
          if( santitize( title ).includes( santitize( paperId ) ) ) hasMatch = true;
          break;
      }

      if( hasMatch ){
        return _.head( PubmedArticleSet );
      } else {
        throw new ArticleIDError( `No PubMed record found '${paperId}'`, paperId );
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