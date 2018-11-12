const on = require('./on-key');
const uuid = require('uuid');
const _ = require('lodash');

const { isInteractionNode, tryPromise } = require('../../../../util');

const SELECT_ON_HANDLE_TAP = false;
const DRAW_ON_HANDLE_TAP = true;
const TAP_IN_DRAW_MODE = true;
const TAP_BG_TO_CANCEL = true;


module.exports = function({ bus, cy, document, controller }){
  if( !document.editable() ){ return; }

  let inDrawMode = false;
  let lastEdgeCreationTime = 0;

  let edgeType = function( source, target ){
    let alreadyConnectedByEdge = source.edgesWith( target ).length > 0;
    let srcDocEl = document.get( source.id() );
    let tgtDocEl = document.get( target.id() );
    let alreadyConnectedByIntn = document.interactions().some( intn => {
      return intn.has( srcDocEl ) && intn.has( tgtDocEl );
    } );
    let alreadyConnected = alreadyConnectedByEdge || alreadyConnectedByIntn;

    if( alreadyConnected ){
      return null;
    } if( isInteractionNode( source ) || isInteractionNode( target ) ){
      return null; // disable hyperedge-like interactions for now
      // return 'flat';
    } else  {
      return 'node';
    }
  };

  let loopAllowed = function( /*node*/ ){
    return false;
  };

  let nodeParams = function( /*source, target*/ ){ // for interaction nodes
    let nodeJson = {
      data: {
        id: uuid(),
        type: 'interaction',
        isInteraction: true,
        isEntity: false,
        arity: 2
      }
    };

    return nodeJson;
  };

  let edgeParams = function( /*source, target, i*/ ){
    let edgeJson = {};

    return edgeJson;
  };

  let complete = function( source, target, addedEles ){
    let addedNodes = addedEles.nodes();
    let createdIntnNode = addedNodes.nonempty();
    let intnNode = createdIntnNode ? addedNodes : isInteractionNode( source ) ? source : target;
    let idIsNotIntn = el => el.id() !== intnNode.id();
    let pptNodes = source.add( target ).filter( idIsNotIntn );
    let ppts = pptNodes.map( n => document.get( n.id() ) );

    let handleIntn = () => {
      if( createdIntnNode ){
        return controller.addInteraction({
          association: 'interaction',
          position: _.clone( intnNode.position() ),
          entries: ppts.map( ppt => ({ id: ppt.id() }) )
        });
      } else {
        let intn = document.get( intnNode.id() );
        let add = ppt => intn.add( ppt );

        return Promise.all( ppts.map( add ) ).then( () => intn );
      }
    };

    let rmPreviewEles = () => {
      // remove the edgehandles eles and let the doc listeners create
      // cy elements with full data
      addedEles.remove();
    };

    let intn;

    let openPopover = () => bus.emit('opentip', intn);

    let disableDrawMode = () => bus.emit('drawtoggle', false);

    lastEdgeCreationTime = Date.now();

    return (
      tryPromise( handleIntn )
      .then( docIntn => intn = docIntn )
      .then( rmPreviewEles )
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
    nodeParams,
    edgeParams,
    complete,
    start: onStart
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

  bus.on('drawon', () => {
    eh.enableDrawMode();
    inDrawMode = true;
  });

  bus.on('drawoff', () => {
    eh.disableDrawMode();

    inDrawMode = false;
  });

  bus.on('drawfrom', el => eh.start(el));

  on('d', () => bus.emit('drawtoggle'));
};
