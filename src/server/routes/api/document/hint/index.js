import _ from 'lodash';

import logger from '../../../../logger.js';
import pubtator from './pubtator.js';

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
 * @returns {Array<Hint>} An array of Hints.
 */
async function find( publicationXref ) {
  try {
    let hints = [];
    for (const provider of PROVIDERS ){
      const providerHints = await provider.hints( publicationXref );
      if( providerHints != null ) hints = _.concat( hints, providerHints );
    }
    return hints;

  } catch(e) {
    logger.error(`Error in hint::find - ${JSON.stringify( publicationXref )}`);
  }
}

export default { find };