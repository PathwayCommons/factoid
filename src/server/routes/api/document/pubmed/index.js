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

class ArticleIDError extends Error {
  constructor(...params) {
    super(...params);
    this.name = 'ArticleIDError';
  }
}

const findPubmedId = async paperId => {

  let id;
  const errMessage = `Unrecognized paperId '${paperId}'`;
  if( !_.isString( paperId ) ) throw new TypeError( errMessage );
  const getUniqueIdOrThrow = async query => {
    const { searchHits, count } = await searchPubmed( query );
    if( count === 1 ){
      return _.first( searchHits );
    } else {
      throw new ArticleIDError( errMessage );
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
          id = getUniqueIdOrThrow( paperIdUrlSearchTerm );
        }
      }

    } else {
      //Last bucket - do a search (title, doi, ...)
      id = getUniqueIdOrThrow( paperId );
    }
  }

  return id;
};

const generatePubmedArticle = title => {

  const PubMedArticle = {
    "MedlineCitation": {
      "Article": {
        "Abstract": null,
        "ArticleTitle": null,
        "AuthorList": [],
        "Journal": {
          "ISOAbbreviation": null,
          "ISSN": null,
          "Issue": null,
          "PubDate": null,
          "Title": null,
          "Volume": null
        }
      },
      "ChemicalList": [],
      "InvestigatorList": [],
      "KeywordList": [],
      "MeshheadingList": []
    },
    "PubmedData": {
      "ArticleIdList": [],
      "History": [],
      "ReferenceList": []
    }
  };

  return _.set( PubMedArticle, [ 'MedlineCitation', 'Article', 'ArticleTitle' ], title );
};

/**
 * getPubmedRecord
 *
 * Retrieve a single PubmedArticle. Shall interpret an input as either:
 *   - A set of digits
 *   - A url
 *     - Containing a set of digits e.g. 'https://www.ncbi.nlm.nih.gov/pubmed/123456'
 *     - Containing a query e.g. 'https://www.ncbi.nlm.nih.gov/pubmed/?term=123456'
 *     - A search returning a single PubMed UID
 *
 * @param {String} paperId Contains or references a single PubMed uid (see above). If 'demo' return canned demo data.
 * @return {Object} The unique PubMedArticle (see [NLM DTD]{@link https://dtd.nlm.nih.gov/ncbi/pubmed/out/pubmed_190101.dtd} )
 * @throws {TypeError} When paperId falls outside of the above cases
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
        throw new ArticleIDError( `No PubMed record for '${paperId}'` );
      }

    } catch ( err ) {
      return generatePubmedArticle( paperId );

    }
  }
};

export { getPubmedArticle, ArticleIDError };