import on from './on-key';
import _ from 'lodash';

import { isInteractionNode, tryPromise } from '../../../../util';

import { PARTICIPANT_TYPE } from '../../../../model/element/participant-type';

const SELECT_ON_HANDLE_TAP = false;
const DRAW_ON_HANDLE_TAP = true;
const TAP_IN_DRAW_MODE = true;
const TAP_BG_TO_CANCEL = true;


export default function({ bus, cy, document, controller }){
  if( !document.editable() ){ return; }

  let inDrawMode = false;
  let pptType = PARTICIPANT_TYPE.UNSIGNED;
  let lastEdgeCreationTime = 0;

  let edgeType = function( /*source, target*/ ){
    return 'flat';
  };

  let loopAllowed = function( /*node*/ ){
    return false;
  };

  let edgeParams = function( /*source, target, i*/ ){ //
    let edgeJson = {
      data: {
        sign: pptType.value
      }
    };

    return edgeJson;
  };

  let ghostEdgeParams = function(){
    return {
      data: {
        sign: pptType.value
      }
    };
  };

  let complete = function( source, target, addedEles ){
    let pptNodes = source.add( target );
    let ppts = pptNodes.map( n => document.get( n.id() ) );
    let isTarget = ppt => ppt.id() === target.id();

    let handleIntn = () => {
      return controller.addInteraction({
        association: 'interaction',
        entries: ppts.map( ppt => ({
          id: ppt.id(),
          group: isTarget(ppt) ? pptType.value : null
        }) )
      });
    };

    let rmPreviewEles = () => {
      // remove the edgehandles eles and let the doc listeners create
      // cy elements with full data
      addedEles.remove();
    };

    let intn;

    let openPopover = () => bus.emit('opentip', intn);

    let disableDrawMode = () => bus.emit('drawtoggle', false);

    let startBatch = () => cy.startBatch();

    let endBatch = () => cy.endBatch();

    lastEdgeCreationTime = Date.now();

    return (
      tryPromise( startBatch )
      .then( handleIntn )
      .then( docIntn => intn = docIntn )
      .then( rmPreviewEles )
      .then( endBatch )
      .then( disableDrawMode )
      .then( openPopover )
    );
  };

  let handlePosition = node => {
    if( isInteractionNode(node) ){
      return 'middle middle';
    } else {
      return 'middle top';
    }
  };

  let sourceNode;
  let onStart = src => sourceNode = src;

  let eh = cy.edgehandles({
    handleNodes: 'node[!isInteraction]',
    handlePosition,
    edgeType,
    loopAllowed,
    edgeParams,
    ghostEdgeParams,
    complete,
    start: onStart,
    snap: true
  });

  cy.on('ehstart', () => bus.emit('drawstart'));
  cy.on('ehstop', () => bus.emit('drawstop'));

  if( DRAW_ON_HANDLE_TAP ){
    cy.on('tap', 'node.eh-handle', _.debounce( () => {
      eh.show( sourceNode );
      eh.start( sourceNode );
    }, 1 ) );
  }

  if( SELECT_ON_HANDLE_TAP ){
    cy.on('tap', 'node.eh-handle', _.debounce( () => { // n.b. select after cytoscape deselection has finished
      let src = sourceNode;

      src.select();

      if( isInteractionNode(src) ){
        src.connectedEdges().select();
      }
    }, 1) );
  }

  if( TAP_IN_DRAW_MODE ){
    cy.on('tap', 'node[?isEntity]', _.debounce((e) => {
      let justCreatedEdge = Date.now() - lastEdgeCreationTime < 250;

      if( inDrawMode && !justCreatedEdge ){
        let el = e.target;

        eh.start(el);
      }
    }, 1));
  }

  if( TAP_BG_TO_CANCEL ){
    cy.on('tap', e => {
      if( e.target === cy && inDrawMode ){
        controller.toggleDrawMode( false );
      }
    });
  }

  bus.on('drawon', (type) => {
    eh.enableDrawMode();

    inDrawMode = true;
    pptType = type;
  });

  bus.on('drawoff', () => {
    eh.disableDrawMode();

    inDrawMode = false;
  });

  bus.on('drawfrom', (el, type) => {
    pptType = type;

    eh.start(el);
  });

  on('2', () => bus.emit('drawtoggle', null, PARTICIPANT_TYPE.UNSIGNED));
  on('3', () => bus.emit('drawtoggle', null, PARTICIPANT_TYPE.POSITIVE));
  on('4', () => bus.emit('drawtoggle', null, PARTICIPANT_TYPE.NEGATIVE));
}
