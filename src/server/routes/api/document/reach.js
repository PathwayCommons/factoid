const Promise = require('bluebird');
const _ = require('lodash');
const uuid = require('uuid');
const toJson = res => res.json();
const fetch = require('node-fetch');
const FormData = require('form-data');
const Organism = require('../../../../model/organism');

const REACH_URL = 'http://agathon.sista.arizona.edu:8080/odinweb/api/text';

module.exports = {
  get: function( text ){
    let makeRequest = () => fetch(REACH_URL, {
      method: 'POST',
      body: (function(){
        let data = new FormData();

        data.append('text', text);

        return data;
      })()
    });

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

      let mergeEntitiesWithSameGround = true;
      let allowImplicitOrgSpec = false;

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

      let getSentenceText = id => {
        let f = getFrame(id);
        let i1 = _.get(f, ['start-pos', 'offset']);
        let i2 = _.get(f, ['end-pos', 'offset']);

        if( i1 != null && i2 != null ){
          return text.substr( i1, i2 );
        }
      };

      let addElement = (el, frame, ground) => {
        let foundMerge = false;

        if( mergeEntitiesWithSameGround && ground != null ){
          let prevGround, prevReachId;

          groundReachMap.forEach( ( gnd, rid ) => {
            if( groundIsSame( gnd, ground ) ){
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

        let contains = ( arr, str ) => arr.indexOf( str.toLowerCase() ) >= 0;
        let supportedTypes = ['protein'];
        let typeIsSupported = contains( supportedTypes, frame.type );
        let supportedGrounds = ['uniprot'];
        let ground = frame.xrefs != null ? frame.xrefs.find( ref => contains( supportedGrounds, ref.namespace ) ) : null;
        let isGrounded = ground != null;

        let org = !isGrounded ? null : Organism.fromName( ground.species );
        let orgIsSupported = org != null && org !== Organism.OTHER;

        // implicit mention of org
        if( orgIsSupported && allowImplicitOrgSpec ){
          enableOrg( org );
        }

        ent.name = frame.text;

        addElement( ent, frame, ground );
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
          let argFrames = args.map( getArgId ).map( getFrame );
          let argsAreEnts = argFrames.every( frameIsEntity );
          let isControllerArg = arg => arg.type === 'controller';
          let isControlledArg = arg => arg.type === 'controlled';
          let argsAreControllerControlled = args.length === 2 && args.some( isControllerArg ) && args.some( isControlledArg );
          let argsAreEntAndEvt = argFrames.some( frameIsEntity ) && argFrames.some( frameIsEvent );
          let getEntryFromEl = el => ({ id: el.id });
          let isSingleArgEvt = frame => frameIsEvent(frame) && _.get(frame, ['arguments', 0, 'argument-type']) === 'entity';
          let evtArg = frame.arguments.find( arg => isSingleArgEvt( getFrame( getArgId(arg) ) ) );
          let haveEvtArg = evtArg != null;
          let isBinaryCollapsible = argsAreEntAndEvt && argsAreControllerControlled && haveEvtArg;

          if( argsAreEnts || isBinaryCollapsible ){
            let intn = {
              id: uuid(),
              type: 'interaction',
              description: getSentenceText( frame.sentence )
            };

            if( argsAreEnts ){
              intn.entries = argFrames.map( getElFromFrame ).map( getEntryFromEl );
            } else if( isBinaryCollapsible ){
              let getEntityFrame = frame => {
                if( frameIsEvent( frame ) ){
                  return getFrame( getArgId( frame.arguments[0] ) );
                } else {
                  return frame;
                }
              };

              intn.entries = argFrames.map( getEntityFrame ).map( getElFromFrame ).map( getEntryFromEl );
            }

            addElement( intn, frame );
          }
        }
      } );

      return {
        elements,
        organisms
      };
    };

    return Promise.try( makeRequest ).then( toJson ).then( makeDocJson );
  }
};
