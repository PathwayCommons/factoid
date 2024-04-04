import _ from 'lodash';

import logger from '../../../../logger.js';
import pubtator from './pubtator.js';
import organism from './organism.js';
import { HINT_TYPE } from '../../../../../model/hint.js';

const PROVIDERS = [
  pubtator
];

/**
 * Aggregate paper Hints from providers
 *
 * @param {Object} publicationXref - An identifier for a paper
 * @param {string} publicationXref.id - The local identifier value
 * @param {string} publicationXref.dbPrefix - The database prefix
 * @param {string} publicationXref.title - The paper title
 * @param {string} publicationXref.abstract - The paper abstract
 * @returns {Object} An object with organismOrdering (sorted NCBI Taxonomy uids) and Array<Hint> of entities
 */
async function find( publicationXref ) {
  const byXref = ({ xref }) => `${xref.dbPrefix}_${xref.id}`;
  let hints = [],
  entities = [],
  organismOrdering = [];

  // Compile hints from all providers
  for ( const provider of PROVIDERS ){
    try {
      const providerHints = await provider.hints( publicationXref );
      if( providerHints != null ) hints = _.concat( hints, providerHints );
    } catch(e) {
      logger.error('Error in hints from provider');
      logger.error(e);
    }
  }

  // Get an organismOrdering
  organismOrdering = organism.order( hints );

  // De-duplicate
  // TODO: Normalize the xrefs - e.g. ATP [CHEBI:15422, MESH:68000255]
  entities = _.uniqBy( hints, byXref );

  return {
    organismOrdering,
    entities
  };
}

export default { find };