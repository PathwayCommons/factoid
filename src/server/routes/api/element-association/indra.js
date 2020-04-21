import fetch from 'node-fetch';
import _ from 'lodash';

import { INDRA_STATEMENTS_URL, INDRA_ENGLISH_ASSEMBLER_URL } from '../../../../config';
import logger from '../../../logger';
import { tryPromise } from '../../../../util';
import { INTERACTION_TYPE } from '../../../../model/element/interaction-type/enum';
import querystring from 'querystring';

const SUB_MODIFICATION_TYPES = ['Phosphorylation', 'Dephosphorylation', 'Dephosphorylation',
  'Deubiquitination', 'Methylation', 'Demethylation'];
const BASE_MODIFICATION_TYPES = ['Sumoylation', 'Desumoylation', 'Hydroxylation', 'Dehydroxylation',
  'Acetylation', 'Deacetylation', 'Glycolsyation', 'Deglycolsyation', 'Farnesylation',
  'Defarnesylation', 'Geranylgeranylation', 'Degeranylgeranylation', 'Palmitoylation',
  'Depalmitoylation', 'Myristoylation', 'Demyristoylation', 'Ribosylation', 'Deribosylation',
  'Autophosphorylation', 'Transphosphorylation'];
const TRANSCRIPTION_TRANSLATION_TYPES = ['IncreaseAmount', 'DecreaseAmount'];
const BINDING_TYPES = ['Complex'];

const getDocuments = pairs => {
  const getForPair = pair => {
    let agent0 = pair[0].toUpperCase();
    let agent1 = pair[1].toUpperCase();

    return tryPromise( () => getInteractions(agent0, agent1) )
      .then( intns => _.groupBy( intns, 'pmid' ) );
  };

  const merger = (objValue, srcValue) => {
    if (_.isArray(objValue)) {
      return objValue.concat(srcValue);
    }
  };

  let promises = pairs.map( getForPair );
  return Promise.all( promises )
    .then( res => _.mergeWith( {}, ...res, merger ) );
};

const transformIntnType = indraType => {
  if ( SUB_MODIFICATION_TYPES.includes( indraType ) ) {
    return indraType.toLowerCase();
  }

  if ( BASE_MODIFICATION_TYPES.includes( indraType ) ) {
    return INTERACTION_TYPE.MODIFICATION.value;
  }

  if ( TRANSCRIPTION_TRANSLATION_TYPES.includes( indraType ) ) {
    return INTERACTION_TYPE.TRANSCRIPTION_TRANSLATION.value;
  }

  if ( BINDING_TYPES.includes( indraType ) ) {
    return INTERACTION_TYPE.BINDING.value;
  }

  return INTERACTION_TYPE.INTERACTION.value;
};

const getInteractions = (agent0, agent1) => {
  return (
    tryPromise( () => getStatements(agent0, agent1) )
      .then( stmts => {
        return assembleEnglish( stmts )
          .then( res => res.json() )
          .then( js => {
            const sentences = js.sentences;

            const extractInteraction = statement => {
              let {id, type, evidence} = statement;
              return {
                text: sentences[id],
                type: transformIntnType(type),
                pmid: evidence[0].pmid
              };
            };

            let intns = stmts.map( extractInteraction );
            return intns;
          } );
      } )
  );
};

const getStatements = (agent0, agent1) => {
  let query = { format: 'json-js', agent0, agent1 };
  let addr = INDRA_STATEMENTS_URL + '?' + querystring.stringify( query );
  return (
    tryPromise( () => fetch(addr) )
      .then( res => res.json() )
      .then( js => Object.values(js.statements) )
  );
};

const assembleEnglish = statements => {
  let addr = INDRA_ENGLISH_ASSEMBLER_URL;
  return fetch( addr, {
    method: 'post',
    body: JSON.stringify({statements}),
    headers: { 'Content-Type': 'application/json' }
  } );
};


export const searchDocuments = opts => {
  let { pairs } = opts;
  return tryPromise( () => getDocuments(pairs) )
    .catch( err => {
      logger.error(`Finding indra documents failed`);
      logger.error(err);

      throw err;
    } );
};
