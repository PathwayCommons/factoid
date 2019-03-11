const _ = require('lodash');
const { tryPromise } = require('../../../../util');
const uuid = require('uuid');
const toJson = res => res.json();
const fetch = require('node-fetch');
const FormData = require('form-data');
const Organism = require('../../../../model/organism');
const { INTERACTION_TYPE } = require('../../../../model/element/interaction-type/enum');
const { PARTICIPANT_TYPE } = require('../../../../model/element/participant-type');
const uniprot = require('../element-association/uniprot');

// TODO re-enable once a more stable solution for pubchem xrefs is found
// https://github.com/PathwayCommons/factoid/issues/228
// const pubchem = require('../element-association/pubchem');

const logger = require('../../../logger');

const { REACH_URL } = require('../../../../config');
const MERGE_ENTS_WITH_SAME_GROUND = true;
const ALLOW_IMPLICIT_ORG_SPEC = true;
const ONLY_BINARY_INTERACTIONS = true;
const NO_SELF_INTERACTIONS = true;
const REMOVE_DISCONNECTED_ENTS = true;
const REMOVE_UNGROUNDED_ENTS = true;
const APPLY_GROUND = true;
const REMOVE_GROUND_FOR_OTHER_SPECIES = false;

const REACH_EVENT_TYPE = Object.freeze({
  REGULATION: 'regulation',
  PROTEIN_MODIFICATION: 'protein-modification',
  PHOSPHORYLATION: 'phosphorylation',
  DEPHOSPHORYLATION: 'dephosphorylation',
  AUTOPHOSPHORYLATION: 'autophosphorylation',
  METHYLATION: 'methylation',
  DEMETHYLATION: 'demethylation',
  UBIQUITINATION: 'ubiquitination',
  DEUBIQUITINATION: 'deubiquitination',
  SUMOLYLATION: 'sumoylation',
  DESUMOLYLATION: 'desumoylation',
  GLYCOSYLATION: 'glycosylation',
  DEGLYCOSYLATION: 'deglycosylation',
  ACETYLATION: 'acetylation',
  DEACETYLATION: 'deacetylation',
  FARNESYLATION: 'farnesylation',
  DEFARNESYLATION: 'defarnesylation',
  RIBOSYLATION: 'ribosylation',
  DERIBOSYLATION: 'deribosylation',
  HYDROXYLATION: 'hydroxylation',
  DEHYDROXYLATION: 'dehydroxylation',
  HYDROLYSIS: 'hydrolysis',
  DEHYDROLYSIS: 'dehydrolysis',
  COMPLEX_ASSEMBLY: 'complex-assembly',
  TRANSLOCATION: 'translocation',
  TRANSCRIPTION: 'transcription',
  AMOUNT: 'amount',
  ACTIVATION: 'activation'
});

const REACH_TO_FACTOID_MECHANISM = new Map([
  [ REACH_EVENT_TYPE.REGULATION, INTERACTION_TYPE.INTERACTION ],
  [ REACH_EVENT_TYPE.PHOSPHORYLATION, INTERACTION_TYPE.PHOSPHORYLATION ],
  [ REACH_EVENT_TYPE.DEPHOSPHORYLATION, INTERACTION_TYPE.DEPHOSPHORYLATION ],
  [ REACH_EVENT_TYPE.AUTOPHOSPHORYLATION, INTERACTION_TYPE.PHOSPHORYLATION ],
  [ REACH_EVENT_TYPE.UBIQUITINATION, INTERACTION_TYPE.UBIQUITINATION ],
  [ REACH_EVENT_TYPE.DEUBIQUITINATION, INTERACTION_TYPE.DEUBIQUITINATION ],
  [ REACH_EVENT_TYPE.METHYLATION, INTERACTION_TYPE.METHYLATION ],
  [ REACH_EVENT_TYPE.DEMETHYLATION, INTERACTION_TYPE.DEMETHYLATION ],
  [ REACH_EVENT_TYPE.UBIQUITINATION, INTERACTION_TYPE.MODIFICATION ],
  [ REACH_EVENT_TYPE.DEUBIQUITINATION, INTERACTION_TYPE.MODIFICATION ],
  [ REACH_EVENT_TYPE.SUMOLYLATION, INTERACTION_TYPE.MODIFICATION ],
  [ REACH_EVENT_TYPE.DESUMOLYLATION, INTERACTION_TYPE.MODIFICATION ],
  [ REACH_EVENT_TYPE.GLYCOSYLATION, INTERACTION_TYPE.MODIFICATION ],
  [ REACH_EVENT_TYPE.DEGLYCOSYLATION, INTERACTION_TYPE.MODIFICATION ],
  [ REACH_EVENT_TYPE.ACETYLATION, INTERACTION_TYPE.MODIFICATION ],
  [ REACH_EVENT_TYPE.DEACETYLATION, INTERACTION_TYPE.MODIFICATION ],
  [ REACH_EVENT_TYPE.FARNESYLATION, INTERACTION_TYPE.MODIFICATION ],
  [ REACH_EVENT_TYPE.DEFARNESYLATION, INTERACTION_TYPE.MODIFICATION ],
  [ REACH_EVENT_TYPE.RIBOSYLATION, INTERACTION_TYPE.MODIFICATION ],
  [ REACH_EVENT_TYPE.DERIBOSYLATION, INTERACTION_TYPE.MODIFICATION ],
  [ REACH_EVENT_TYPE.HYDROXYLATION, INTERACTION_TYPE.MODIFICATION ],
  [ REACH_EVENT_TYPE.DEHYDROXYLATION, INTERACTION_TYPE.MODIFICATION ],
  [ REACH_EVENT_TYPE.HYDROLYSIS, INTERACTION_TYPE.MODIFICATION ],
  [ REACH_EVENT_TYPE.DEHYDROLYSIS, INTERACTION_TYPE.MODIFICATION ],
  [ REACH_EVENT_TYPE.TRANSLOCATION, INTERACTION_TYPE.INTERACTION ],
  [ REACH_EVENT_TYPE.AMOUNT, INTERACTION_TYPE.INTERACTION ],
  [ REACH_EVENT_TYPE.PROTEIN_MODIFICATION, INTERACTION_TYPE.MODIFICATION ],
  [ REACH_EVENT_TYPE.TRANSCRIPTION, INTERACTION_TYPE.TRANSCRIPTION_TRANSLATION ],
  [ REACH_EVENT_TYPE.COMPLEX_ASSEMBLY, INTERACTION_TYPE.BINDING ],
  [ REACH_EVENT_TYPE.ACTIVATION, INTERACTION_TYPE.INTERACTION ]
]);

module.exports = {
  // TODO remove this function as reach should never need to be exposed directly
  getRawResponse: function( text ){
    let form = new FormData();

    form.append('file', text, {
      filename: 'myfile.txt'
    });

    return fetch(REACH_URL, {
      method: 'POST',
      body: form
    });
  },
  get: function( text ){
    let makeRequest = () => this.getRawResponse( text );

    let makeDocJson = res => {
      let elements = [];
      let elementsReachMap = new Map();
      let groundReachMap = new Map();
      let organisms = [];

      let enableOrg = org => {
        if( organisms.some( o => o.id === org.id() ) ){
          return; // already have it
        } else {
          organisms.push({ id: org.id() });
        }
      };

      let entFrames = _.get( res, ['entities', 'frames'] ) || [];
      let evtFrames = _.get( res, ['events', 'frames'] ) || [];
      let senFrames = _.get( res, ['sentences', 'frames'] ) || [];

      let framesMap = new Map();
      let getFrame = id => framesMap.get( id );
      let getReachId = frame => frame['frame-id'];
      let addFrame = frame => framesMap.set( getReachId(frame), frame );
      let groundIsSame = (g1, g2) => g1.namespace === g2.namespace && g1.id === g2.id;
      let elIsIntn = el => el.entries != null;
      let contains = ( arr, str ) => arr.indexOf( str.toLowerCase() ) >= 0;

      let getSentenceText = id => {
        let f = getFrame( id );
        let i1 = _.get(f, ['start-pos', 'offset']);
        let i2 = _.get(f, ['end-pos', 'offset']);

        if( i1 != null && i2 != null ){
          return text.substr( i1, i2 );
        }
      };

      let groundPromises = [];

      let addElement = (el, frame, ground) => {
        let foundMerge = false;

        if( MERGE_ENTS_WITH_SAME_GROUND && ground != null ){
          let prevGround, prevReachId;

          groundReachMap.forEach( ( gnd, rid ) => {
            if( gnd != null && groundIsSame( gnd, ground ) ){
              foundMerge = true;
              prevGround = gnd;
              prevReachId = rid;
            }
          } );

          if( foundMerge ){
            el = elementsReachMap.get( prevReachId );
            ground = prevGround;
          }
        }

        let reachId = getReachId( frame );

        if( !foundMerge ){
          elements.push( el );
        }

        if( APPLY_GROUND && ground != null ){
          let q = {
            id: ground.id
          };

          let applyGround = tryPromise( () => {
            switch( ground.namespace ){
            case 'uniprot':
              return uniprot.get( q );
            case 'pubchem':
              return null;
              // TODO re-enable once a more stable solution for pubchem xrefs is found
              // https://github.com/PathwayCommons/factoid/issues/228
              // return pubchem.get( q );
            default:
              return null;
            }
          } ).then( assoc => {
            if( assoc ){
              el.association = assoc;
              el.completed = true;
            }
          } );

          groundPromises.push( applyGround );
        }

        elementsReachMap.set( reachId, el );
        groundReachMap.set( reachId, ground );
      };

      entFrames.forEach( addFrame );
      evtFrames.forEach( addFrame );
      senFrames.forEach( addFrame );

      // add bio entities
      entFrames.forEach( frame => {
        let ent = {
          type: 'entity',
          id: uuid()
        };

        let supportedTypes = {
          'protein': 'protein',
          'gene': 'protein',
          'gene-or-gene-product': 'protein',
          'simple-chemical': 'chemical'
        };

        const supportedGrounds = [
          'uniprot',
          'pubchem'
        ];

        let type = frame.type;
        let typeIsSupported = supportedTypes[type] != null;
        let ground = frame.xrefs != null ? frame.xrefs.find( ref => contains( supportedGrounds, ref.namespace ) ) : null;
        let isGrounded = ground != null;

        let org = !isGrounded ? null : Organism.fromName( ground.species );
        let orgIsSupported = org != null && org !== Organism.OTHER;

        if( REMOVE_UNGROUNDED_ENTS && !isGrounded ){
          return; // skip this element/frame
        }

        // implicit mention of org
        if( orgIsSupported && ALLOW_IMPLICIT_ORG_SPEC ){
          enableOrg( org );
        }

        if( REMOVE_GROUND_FOR_OTHER_SPECIES && org != null && !orgIsSupported ){
          ground = null;
        }

        if( typeIsSupported ){
          ent.type = supportedTypes[type];
        }

        ent.name = frame.text;

        if( typeIsSupported ){
          addElement( ent, frame, ground );
        }
      } );

      // add explicit organisms
      entFrames.filter( frame => {
        return frame.type === 'species' && frame.xrefs != null && frame.xrefs.length > 0 && frame.xrefs[0].namespace === 'taxonomy';
      } ).forEach( frame => {
        let xref = frame.xrefs[0];
        let id = +xref.id;
        let org = Organism.fromId( id );
        let orgIsSupported = org !== Organism.OTHER;

        if( orgIsSupported ){
          enableOrg( org );
        }
      } );

      // add interactions
      evtFrames.forEach( frame => {

        const VALID_CONTROLLED_TYPES = new Set([
          REACH_EVENT_TYPE.PROTEIN_MODIFICATION,
          REACH_EVENT_TYPE.TRANSLOCATION,
          REACH_EVENT_TYPE.TRANSCRIPTION,
          REACH_EVENT_TYPE.AMOUNT
        ]);
        const frameIsBindingType = frame => frame.type === REACH_EVENT_TYPE.COMPLEX_ASSEMBLY;
        const frameIsControlType = frame => frame.type === REACH_EVENT_TYPE.REGULATION || frame.type === REACH_EVENT_TYPE.ACTIVATION;
        const argIsControlled = arg => arg['type'] === 'controlled';
        const argIsEntity = arg => arg['argument-type'] === 'entity';
        const argIsEvent = arg => arg['argument-type'] === 'event';
        const argByType = ( frame, type ) => frame.arguments.find( arg => arg.type === type  );
        const getArgId = arg => arg.arg;
        const entityTemplate = ( arg, type ) => ({ record: getFrame( getArgId( arg ) ), type });

        const getArgEntity = arg => {
          const type = _.get( arg, ['type'] );
          return entityTemplate( arg, type );
        };

        // NB: In case we do not support it, return null
        const getControlTypeArgEntity = arg => {
          let entity = null;

          if ( argIsEntity( arg ) ){
            entity = getArgEntity( arg );

          } else if( argIsEvent( arg ) && argIsControlled( arg ) ){
            const eventArgFrame = getFrame( getArgId( arg ) );
            const eventArgFrameType = eventArgFrame.type;

            if( VALID_CONTROLLED_TYPES.has( eventArgFrameType ) ){
              const entityArg = argByType( eventArgFrame, 'theme' );
              entity = getArgEntity( entityArg );
            }
          }
          return entity;
        };

        const getFrameEntities = frame => {
          let entities = [];
          const fargs = _.get( frame, ['arguments'] );

          if( frameIsBindingType( frame ) ){
            entities = fargs.map( getArgEntity );

          } else if ( frameIsControlType( frame ) ){
            entities = fargs.map( getControlTypeArgEntity );
          }
          return entities;
        };

        const targetArgTypes = new Set([ 'theme', 'controlled' ]);
        const isTargetArgType = type => targetArgTypes.has( type );
        const getTargetSign = signKey => {
          let sign = PARTICIPANT_TYPE.UNSIGNED;

          if ( signKey.startsWith( 'positive' ) ) {
            sign = PARTICIPANT_TYPE.POSITIVE;
          } else if ( signKey.startsWith( 'negative' ) ) {
            sign = PARTICIPANT_TYPE.NEGATIVE;
          }
          return sign;
        };

        const entryFromEl = el => el == null ? null : ({ id: el.id });
        const getEntryByEntity = ( entity, subtype ) => {
          if( !entity || !elementsReachMap.has( getReachId( entity.record ) ) ) return null;

          const signKey = subtype || '';
          const el = elementsReachMap.get( getReachId( entity.record ) );
          const entry = entryFromEl( el );
          if( entry && isTargetArgType( entity.type ) ) entry.group = getTargetSign( signKey ).value;
          return entry;
        };

        const getSimpleMechanism = frame => frame.type === REACH_EVENT_TYPE.PROTEIN_MODIFICATION ? frame.subtype : frame.type;

        const getMechanism = frame => {
          let reachMech;
          if( frame.type === REACH_EVENT_TYPE.REGULATION ){
            const controlledFrame = getFrame( getArgId( argByType( frame, 'controlled' ) ) );
            reachMech = controlledFrame.type === REACH_EVENT_TYPE.REGULATION ? REACH_EVENT_TYPE.REGULATION : getSimpleMechanism( controlledFrame );

          } else if ( frame.type === REACH_EVENT_TYPE.ACTIVATION ) {
            reachMech = REACH_EVENT_TYPE.ACTIVATION;

          } else {
            reachMech = getSimpleMechanism( frame );
          }
          return REACH_TO_FACTOID_MECHANISM.get( reachMech );
        };

        const intn = {
          id: uuid(),
          type: 'interaction',
          description: getSentenceText( frame.sentence )
        };

        const entityList = getFrameEntities( frame );
        const entries =  entityList.map( entity => getEntryByEntity( entity, frame.subtype ) );
        // NB: If nothing comes back, or there was a null participant, then it wasn't supported
        // so we should skip it due to contract with downstream functions.
        if( _.isEmpty( entries ) || entries.some( _.isNull ) ) return;

        intn.entries = entries;
        const mechanism =  getMechanism( frame );
        intn.association = mechanism.value;
        intn.reach = frame;
        intn.completed = true;
        addElement( intn, frame );

      }); // END evtFrames.forEach

      // Filtering
      const entities = elements.filter( e => !elIsIntn( e ) );
      let interactions = elements.filter( elIsIntn );
      const pickByNumParticipants = ( interactions, numParticipants ) =>  interactions.filter( interaction => interaction.entries.length === numParticipants );
      const pickByUniqueParticipants = interactions =>  interactions.filter( interaction => _.uniqBy( interaction.entries, 'id' ).length === interaction.entries.length );
      if( ONLY_BINARY_INTERACTIONS ) interactions = pickByNumParticipants( interactions, 2 );
      if( NO_SELF_INTERACTIONS ) interactions = pickByUniqueParticipants( interactions );

      elements = _.concat( entities, interactions );

      if( REMOVE_DISCONNECTED_ENTS ){
        let interactions = elements.filter( elIsIntn );
        let pptIds = ( () => {
          let set = new Set();

          interactions.forEach( intn => intn.entries.forEach( en => set.add( en.id ) ) );

          return set;
        } )();
        let elIsInSomeIntn = el => pptIds.has( el.id );

        elements = elements.filter( el => elIsIntn(el) || elIsInSomeIntn(el) );
      }

      return tryPromise( () => {
        return Promise.all( groundPromises );
      } ).then( () => {

        if( elements.length === 0 ){
          logger.error(` REACH service recognized 0 entities from the given text: `, text);
        }
        return {
          elements,
          organisms
        };
      } );
    };

    return tryPromise( makeRequest ).then( toJson ).then( makeDocJson );
  }
};
