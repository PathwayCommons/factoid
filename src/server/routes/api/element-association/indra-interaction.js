import fetch from 'node-fetch';

import { INDRA_INTERACTION_BASE_URL } from '../../../../config';
import logger from '../../../logger';
import { tryPromise } from '../../../../util';
import querystring from 'querystring';

const BASE_URL = INDRA_INTERACTION_BASE_URL

const request = ( endpt, query ) => {
  let addr = BASE_URL + `${endpt}?` + querystring.stringify( query );
  console.log(addr)

  return (
    tryPromise( () => fetch( addr ) )
      .then( res => res.json() )
  );
};


export const search = opts => {
  let { genes, offset, limit } = opts;
  console.log(genes)
  let queryOpts = { source: genes };
  return tryPromise( () => request( 'find-interactions', queryOpts ) )
    .then( intns => intns.slice( offset, offset + limit ) )
    .catch( err => {
      logger.error(`Finding indra interactions failed`);
      logger.error(err);

      throw err;
    } );
};
