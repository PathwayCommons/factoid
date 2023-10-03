import _ from 'lodash';
import logger from '../../../../logger';

import { search, get } from './api.js';

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
  const orderByCreation = works => {
    const byCreated = ( a, b ) => b.created.timestamp - a.created.timestamp;

    let ordered = works;
    const top = _.head( works );
    if( top ) ordered = works.filter( h => h.score === top.score );
    return ordered.sort( byCreated );
  };

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
  // Order based on score, then created date
  const ordered = orderByCreation( matches );
  return _.head( ordered );
};

/**
 * find
 *
 * Find a matching Work from CrossRef. Shall interpret an input as:
 *   1. Digital Object Identifier (doi)
 *   2. Plain text (titles, authors, ISSNs and publication years)
 *
 * @param {string} paperId Contains or references a single article
 * @return {Object} matching Work
 */
const find = async paperId => {
  const VALID_TYPES = new Set([ 'posted-content' ]);
  const VALID_SUBTYPES = new Set([ 'preprint' ]);

  const paperId2Type = paperId => {
    // 99.3% of CrossRef DOIs (https://www.crossref.org/blog/dois-and-matching-regular-expressions/)
    const doiRegex = /^10\.\d{4,9}\/[-._;()/:A-Z0-9]+$/i;
    let IdType = ID_TYPE.TERM;
    const isDoiLike = doiRegex.test( paperId );
    if( isDoiLike ) IdType = ID_TYPE.DOI;
    return IdType;
  };
  const isSupported = work => {
    let ok;
    const { type, subtype } = work;
    if( subtype ){
      ok = VALID_SUBTYPES.has( subtype );
    } else {
      ok = VALID_TYPES.has( type );
    }
    return ok;
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
      return m;
    } else {
      throw new Error(`Unable to find a CrossRef Work for '${paperId}`);
    }

  } catch( err ) {
    logger.error( `${err.name}: ${err.message}` );
    throw new Error( `Unrecognized paperId '${paperId}'`, paperId );
  }
};

export { find, match, ID_TYPE };