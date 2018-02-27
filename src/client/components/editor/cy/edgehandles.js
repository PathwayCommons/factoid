let on = require('./on-key');
let uuid = require('uuid');
let _ = require('lodash');
let Promise = require('bluebird');

let { isInteractionNode } = require('../../../../util');

let SELECT_ON_HANDLE_TAP = false;
let DRAW_ON_HANDLE_TAP = true;

module.exports = function({ bus, cy, document, controller }){
  if( !document.editable() ){ return; }

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

    let getIntn = () => {
      if( createdIntnNode ){
        return controller.addInteraction({
          position: _.clone( intnNode.position() )
        });
      } else {
        return document.get( intnNode.id() );
      }
    };

    let addPpts = intn => Promise.all( pptNodes.map( n => intn.add( document.get( n.id() ) ) ) ).then( () => intn );

    let rmPreviewEles = () => {
      // remove the edgehandles eles and let the doc listeners create
      // cy elements with full data
      addedEles.remove();
    };

    let replaceEdges = () => {
      let intn;

      return getIntn().then( i => intn = i ).then( () => rmPreviewEles() ).then( () => intn );
    };

    let openPopover = intn => bus.emit('opentip', intn);

    let disableDrawMode = () => bus.emit('drawtoggle', false);

    Promise.try( replaceEdges ).then( addPpts ).then( openPopover ).then( disableDrawMode );
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

  bus.on('drawon', () => eh.enableDrawMode());
  bus.on('drawoff', () => eh.disableDrawMode());
  bus.on('drawfrom', el => eh.start(el));

  on('d', () => bus.emit('drawtoggle'));
};
