import _ from 'lodash';

import logger from '../../../../logger.js';
import pubtator from './pubtator.js';

const PROVIDERS = [
  pubtator
];

/**
 * Get hints from providers
 * @param {string} pmid A PubMed uid
 * @returns {Array<Hint>} An array of Hints.
 */
async function find( id ) {
  try {
    let hints = [];
    for (const provider of PROVIDERS ){
      const providerHints = await provider.hints( id );
      if( providerHints != null ) hints = _.concat(hints, providerHints);
    }
    // TODOs
    //
    // Aggregate from providers
    // Prioritize species based on section, etc.

    return hints;

  } catch(e) {
    logger.error(`Error in hint::find - ${id}`);
  }
}

export default { find };