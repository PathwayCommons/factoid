const Promise = require('bluebird');
const _ = require('lodash');
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
const REMOVE_DISCONNECTED_ENTS = true;
const REMOVE_UNGROUNDED_ENTS = false;
const APPLY_GROUND = true;
const REMOVE_GROUND_FOR_OTHER_SPECIES = false;

const REACH_EVENT_TYPE = Object.freeze({
  TRANSCRIPTION: 'transcription',
  PHOSPHORYLATION: 'phosphorylation',
  METHYLATION: 'methylation',
  ACTIVATION: 'activation'
});

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
      let elementsMap = new Map();
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

      let frames = new Map();
      let getFrame = id => frames.get( id );
      let getReachId = frame => frame['frame-id'];
      let addFrame = frame => frames.set( getReachId(frame), frame );
      let getElFromFrame = frame => elementsReachMap.get( getReachId( frame ) );
      let frameIsEntity = frame => frame['frame-type'] === 'entity-mention';
      let frameIsEvent = frame => frame['frame-type'] === 'event-mention';
      let getArgId = arg => arg.arg;
      let groundIsSame = (g1, g2) => g1.namespace === g2.namespace && g1.id === g2.id;
      let elIsIntn = el => el.entries != null;

      let getSentenceText = id => {
        let f = getFrame(id);
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
          elementsMap.set( el.id, el );
        }

        if( APPLY_GROUND && ground != null ){
          let q = {
            id: ground.id
          };

          let applyGround = Promise.try( () => {
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
          'simple-chemical': 'chemical'
        };

        let contains = ( arr, str ) => arr.indexOf( str.toLowerCase() ) >= 0;
        let type = frame.type;
        let typeIsSupported = supportedTypes[type] != null;
        let supportedGrounds = ['uniprot', 'pubchem'];
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
        let args = frame.arguments;

        if( args.length === 2 ){
          let argFrames = args.map( getArgId ).map( getFrame ).filter( frame => frame != null );
          let argsAreEnts = argFrames.every( frameIsEntity );
          let isControllerArg = arg => arg.type === 'controller';
          let isControlledArg = arg => arg.type === 'controlled';
          let argsAreControllerControlled = args.length === 2 && args.some( isControllerArg ) && args.some( isControlledArg );
          let argsAreEntAndEvt = argFrames.every( frame => frameIsEntity(frame) || frameIsEvent(frame) );
          let getEntryFromEl = el => el == null ? null : ({ id: el.id });
          let isSingleArgEvt = frame => frameIsEvent(frame) && _.get(frame, ['arguments', 0, 'argument-type']) === 'entity';
          let evtArg = frame.arguments.find( arg => isSingleArgEvt( getFrame( getArgId(arg) ) ) );
          let haveEvtArg = evtArg != null;
          let isBinaryCollapsible = argsAreEntAndEvt && argsAreControllerControlled && haveEvtArg;
          let isProtein = ele => ele.type == 'protein' || ele.type === 'gene';

          if( argsAreEnts || isBinaryCollapsible ){
            let intn = {
              id: uuid(),
              type: 'interaction',
              description: getSentenceText( frame.sentence )
            };

            let elIdToFrameId = new Map();
            let controllerId = argsAreControllerControlled ? getArgId( args.find( isControllerArg ) ) : null;

            let getElAndSetMap = frame => {
              let el = getElFromFrame( frame );

              if ( el ) {
                elIdToFrameId.set( el.id, frame['frame-id'] );
              }

              return el;
            };

            let getTargetSign = () => {
              let subtype = frame.subtype;

              if ( !subtype ) {
                return null;
              }

              if ( subtype.startsWith( 'positive' ) ) {
                return PARTICIPANT_TYPE.POSITIVE;
              }

              if ( subtype.startsWith( 'negative' ) ) {
                return PARTICIPANT_TYPE.NEGATIVE;
              }

              return PARTICIPANT_TYPE.UNSIGNED_TARGET;
            };

            let attachTargetGroup = entry => {
              let elFrameId = elIdToFrameId.get( entry.id );

              // If the entry does not represent the controlled arg return directly
              if ( !argsAreControllerControlled || elFrameId == controllerId ) {
                return;
              }

              let targetSign = getTargetSign();

              if ( targetSign ) {
                entry.group = targetSign.value;
              }

              return entry;
            };

            let getAssociation = eles => {
              let protCount = eles.filter( isProtein ).length;

              // protein - protein
              if ( protCount == 2 ) {
                if ( isBinaryCollapsible ) {
                  let type = getFrame( getArgId( evtArg ) ).subtype;

                  switch ( type ) {
                    case REACH_EVENT_TYPE.TRANSCRIPTION:
                      return INTERACTION_TYPE.EXPRESSION;
                    case REACH_EVENT_TYPE.PHOSPHORYLATION:
                      return INTERACTION_TYPE.PHOSPHORYLATION;
                    case REACH_EVENT_TYPE.METHYLATION:
                      return INTERACTION_TYPE.METHYLATION;
                  }
                }
              }
              // protein - chemical
              else if ( protCount == 1 ) {
                if ( argsAreEnts ) {
                  // more cases would be added in the future
                  switch ( frame.type ) {
                    case REACH_EVENT_TYPE.ACTIVATION:
                      return INTERACTION_TYPE.PROTEIN_CHEMICAL;
                  }
                }
              }

              return INTERACTION_TYPE.INTERACTION;
            };

            let getEntityFrame = frame => {
              if( frameIsEvent( frame ) ){
                return getFrame( getArgId( frame.arguments[0] ) );
              } else {
                return frame;
              }
            };

            let eles = (
              argFrames.map( getEntityFrame )
              .map( getElAndSetMap )
              .filter( ele => ele != null )
            );

            intn.entries = eles.map( getEntryFromEl );

            intn.entries.forEach( attachTargetGroup );

            let assoc = getAssociation( eles );

            if( assoc ){
              intn.association = assoc.value;

              let isDirected = intn.entries.filter( ent => ent.group != null ).length > 0;

              // NB an interaction must have assoc/type + direction to be completed
              if( isDirected ){
                intn.completed = true;
              }
            }

            if( intn.entries.length >= 2 && intn.completed ){
              addElement( intn, frame );
            }
          }
        }
      } );

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

      return Promise.try( () => {
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

    return Promise.try( makeRequest ).then( toJson ).then( makeDocJson );
  }
};
