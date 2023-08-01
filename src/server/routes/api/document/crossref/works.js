import _ from 'lodash';
import logger from '../../../../logger';

import { search, get } from './api.js';

const ID_TYPE = Object.freeze({
  DOI: 'doi',
  TITLE: 'title'
});

const ALLOWABLE_TYPES = new Set([
  'posted-content'
]);
const ALLOWABLE_SUBTYPES = new Set([
  'preprint'
]);

const paperId2Type = paperId => {
  // 99.3% of CrossRef DOIs (https://www.crossref.org/blog/dois-and-matching-regular-expressions/)
  const doiRegex = /^10\.\d{4,9}\/[-._;()/:A-Z0-9]+$/i;
  let IdType = ID_TYPE.TITLE;
  const isDoiLike = doiRegex.test( paperId );
  if( isDoiLike ) IdType = ID_TYPE.DOI;
  return IdType;
};

/**
 * bestMatch
 *
 * In case scores tie, works are prioritized by creation time
 *
 * @param {string} paperId the identifier supplied
 * @param {string} IdType The ID_TYPE
 * @param {object} hits search hit items
 * @returns
 */
const bestMatch = ( paperId, IdType, hits ) => {
  let match;

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
      case ID_TYPE.TITLE:
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
  match = _.head( ordered );
  return match;
};

/**
 * isSupported
 *
 * Check if the work is a supported type, subtype
 *
 * @param {object} work A CrossRef message item
 * @returns true if supported
 */
const isSupported = work => {
  const { type, subtype } = work;
  const isOk = ALLOWABLE_TYPES.has(type) && ALLOWABLE_SUBTYPES.has( subtype );
  return isOk;
};

/**
 * findCrossRefWork
 *
 * Find a matching Work from CrossRef. Shall interpret an input as:
 *   1. Digital Object Identifier (doi)
 *   2. The exact (or partial) title
 *
 * @param {string} paperId Contains or references a single article
 * @return {Object} matching Work
 */
const findCrossRefWork = async paperId => {
  const isValidRecord = work => isSupported(work);
  try {
    let hits, match;
    const IdType = paperId2Type( paperId );

    if( IdType === ID_TYPE.TITLE ){
      const type = Array.from( ALLOWABLE_TYPES ).join(',');
      const filter = `type:${type}`;
      const works = await search( paperId, { filter } );
      hits = works.searchHits;
    } else if (IdType === ID_TYPE.DOI){
      const work =  await get( paperId );
      hits = [work];
    }

    match = await match( paperId, IdType, hits );
    if( isValidRecord( match ) ){
      return match;
    } else {
      throw new Error(`Unable to find a CrossRef Work for '${paperId}`);
    }

  } catch( err ) {
    logger.error( `${err.name}: ${err.message}` );
    throw new Error( `Unrecognized paperId '${paperId}'`, paperId );
  }
};

export { findCrossRefWork, bestMatch };