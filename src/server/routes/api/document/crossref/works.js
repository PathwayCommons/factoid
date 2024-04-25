import _ from 'lodash';
import logger from '../../../../logger';

import { search, get } from './api.js';
import { toPubMedArticle } from './map';
import { HTTPStatusError, isDoi } from '../../../../../util';
import { ArticleIDError } from '../../../../../util/pubmed';

const ID_TYPE = Object.freeze({
  DOI: 'doi',
  TERM: 'term'
});

/**
 * match
 *
 * In case scores tie, works are prioritized by creation time
 *
 * @param {string} paperId the identifier supplied
 * @param {string} IdType The ID_TYPE
 * @param {object} hits search hit items
 * @returns
 */
const match = ( paperId, IdType, hits ) => {
  const byCreated = ( a, b ) => b.created.timestamp - a.created.timestamp;
  const sanitize = raw => {
    const trimmed = _.trim( raw , ' .');
    const lower = _.toLower( trimmed );
    const clean = lower.replace(/[\W_]+/g, ' ');
    return clean;
  };

  const workMatchesPaperId = work => {
    const { DOI, title } = work;
    let hasMatch = false;
    switch ( IdType ) {
      case ID_TYPE.DOI:
        if( DOI.toLowerCase() === paperId.toLowerCase() ){
          hasMatch = true;
        }
        break;
      case ID_TYPE.TERM:
        if( sanitize(title.join(' ')).includes( sanitize(paperId) ) ){
          hasMatch = true;
        }
        break;
    }

    return hasMatch;
  };

  // Filter hits based on match to title (partial), DOI (exact
  const matches = hits.filter( workMatchesPaperId );
  // Order by created date
  matches.sort( byCreated );
  return _.head( matches );
};

/**
 * findPreprint
 *
 * Find a matching preprint from CrossRef.
 * Restricted to particular publishers
 * Shall interpret an input as:
 *   1. Digital Object Identifier (doi)
 *   2. Plain text (titles, authors, ISSNs and publication years)
 *
 * @param {string} paperId Contains or references a single article
 * @return {Object} matching Work
 */
const findPreprint = async paperId => {
  const VALID_TYPES = new Set([ 'posted-content' ]);
  const VALID_SUBTYPES = new Set([ 'preprint' ]);
  const VALID_PUBLISHERS = new Set([
    'Cold Spring Harbor Laboratory',
    'eLife Sciences Publications, Ltd',
    'Research Square Platform LLC'
  ]);
  const isPreprint = ({ type, subtype }) => VALID_SUBTYPES.has( subtype ) && VALID_TYPES.has( type );
  const isRecognizedPublisher = ({ publisher }) => VALID_PUBLISHERS.has( publisher );
  const isSupported = w => !_.isUndefined( w ) && isPreprint( w ) && isRecognizedPublisher( w );
  const paperId2Type = paperId => {
    // 99.3% of CrossRef DOIs (https://www.crossref.org/blog/dois-and-matching-regular-expressions/)
    let IdType = ID_TYPE.TERM;
    const isDoiLike = isDoi( paperId );
    if( isDoiLike ) IdType = ID_TYPE.DOI;
    return IdType;
  };

  try {
    let hits, m;
    const IdType = paperId2Type( paperId );

    if( IdType === ID_TYPE.TERM ){
      const type = Array.from( VALID_TYPES ).join(',');
      const filter = `type:${type}`;
      const works = await search( paperId, { filter } );
      hits = works.searchHits;

    } else if (IdType === ID_TYPE.DOI){
      const work =  await get( paperId );
      hits = [work];
    }

    m = match( paperId, IdType, hits );

    if( isSupported( m ) ){
      return toPubMedArticle( m );
    } else {
      throw new ArticleIDError( `Unrecognized paperId '${paperId}'`, paperId );
    }

  } catch( err ) {
    if( err instanceof HTTPStatusError ){
      const { response } = err;
      const { url, headers } = response;
      logger.error( `crossref.findPreprint threw ${err.name}: ${err.message}` );
      logger.error( `fetch URL: ${url}` );
      logger.error( headers.raw() );

    } else if( err instanceof ArticleIDError ){
      logger.info( `crossref.findPreprint threw ${err.name}: ${err.message}` );

    } else {
      logger.error( `crossref.findPreprint threw ${err.name}: ${err.message}` );
    }
    throw err;
  }
};

export { findPreprint, match, ID_TYPE };