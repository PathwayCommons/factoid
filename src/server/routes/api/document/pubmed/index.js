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

const pubTypeToExclude = [
  { UI: 'D016425', value: 'Published Erratum' },
  { UI: 'D016440', value: 'Retraction of Publication' }
];

const paperId2Type = paperId => {
  // 99.3% of CrossRef DOIs (https://www.crossref.org/blog/dois-and-matching-regular-expressions/)
  const doiRegex = /^10\.\d{4,9}\/[-._;()/:A-Z0-9]+$/i;
  const digitsRegex = /^[0-9.]+$/;

  let IdType = ID_TYPE.TITLE;
  const isUidLike = digitsRegex.test( paperId );
  const isDoiLike = doiRegex.test( paperId );

  if( isDoiLike ) {
    IdType = ID_TYPE.DOI;
  } else if ( isUidLike ){
    IdType = ID_TYPE.PMID;
  }

  return IdType;
};

const findMatchingPubmedArticle = async ( paperId, IdType, uids ) => {
  let PubmedArticle;
  // Pubmed EFETCH returns lower-cased title, adds trailing period
  const santitize = raw => {
    const trimmed = _.trim( raw , ' .');
    const lower = _.toLower( trimmed );
    const clean = lower.replace(/[\W_]+/g, ' ');
    return clean;
  };

  // Try to match: Could be responsibility of user in future
  const articleMatchesPaperId = article => {
    const { title, pmid, doi, pubTypes } = getPubmedCitation( article );
    let hasMatch = false;

    // Ignore if this article contains an invalid PublicationType entry
    const isValidType = _.isEmpty( _.intersectionBy( pubTypes, pubTypeToExclude, 'UI' ) );
    if( isValidType ){
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
    }
    return hasMatch;
  };

  if( uids.length ){
    const { PubmedArticleSet } = await fetchPubmed({ uids });
    PubmedArticle = PubmedArticleSet.find( articleMatchesPaperId );
  }
  return PubmedArticle;
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
      const IdType = paperId2Type( paperId );
      const fieldOpts = IdType === ID_TYPE.TITLE ? { field: ID_TYPE.TITLE } : {};
      const { searchHits } = await searchPubmed( paperId, fieldOpts );
      const PubmedArticle = await findMatchingPubmedArticle( paperId, IdType, searchHits );

      if( PubmedArticle ){
        return PubmedArticle;
      } else {
        throw new Error(`Unable to retrieve a PubmedArticle for '${paperId}`);
      }

    } catch( err ) {
      logger.error( `${err.name}: ${err.message}` );
      throw new ArticleIDError( `Unrecognized paperId '${paperId}'`, paperId );
    }
  }
};

export { getPubmedArticle };