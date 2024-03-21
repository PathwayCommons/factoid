import logger from '../../../../logger.js';
import pubtator from './pubtator.js';

/**
 * Wrapper for bioentity hint providers
 */
async function find( id ) {
  try {
    let hints = null;
    const bioCDocument = await pubtator.get( id );
    if( bioCDocument != null ) hints = pubtator.map( bioCDocument );
    return hints;

  } catch(e) {
    logger.error(`Error in hint::find - ${id}`);
  }
}

export default { find };