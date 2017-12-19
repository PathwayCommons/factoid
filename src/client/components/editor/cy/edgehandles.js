let on = require('./on-key');
let defs = require('./defs');
let uuid = require('uuid');
let _ = require('lodash');
let Promise = require('bluebird');

let { isInteractionNode } = require('../../../../util');

module.exports = function({ bus, cy, document, controller }){
  if( !document.editable() ){ return; }

  cy.edgehandles({
    handleNodes: 'node',
    handleSize: 10,
    handleHitThreshold: 6,
    handleColor: defs.activeColor,
    handleOutlineColor: '#fff',
    handleOutlineWidth: 1,
    handleIcon: ( () => {
      let svg = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="#fff" d="M11.59 7.41L15.17 11H1v2h14.17l-3.59 3.59L13 18l6-6-6-6-1.41 1.41zM20 6v12h2V6h-2z"/></svg>';
      let dataUri = 'data:image/svg+xml;utf8,' + encodeURIComponent( svg );
      let img = new Image();

      img.src = dataUri;
      img.width = 7;
      img.height = 7;

      return img;
    } )(),
    toggleOffOnLeave: true,
    edgeType: function( source, target ){
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
        return 'flat';
      } else  {
        return 'node';
      }
    },
    loopAllowed: function( /*node*/ ){
      return false;
    },
    nodeParams: function( /*source, target*/ ){ // for interaction nodes
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
    },
    edgeParams: function( /*source, target, i*/ ){
      let edgeJson = {};

      return edgeJson;
    },
    complete: function( source, target, addedEles ){
      let addedNodes = addedEles.nodes();
      let createdIntnNode = addedNodes.nonempty();
      let intnNode = createdIntnNode ? addedNodes : isInteractionNode( source ) ? source : target;
      let idIsNotIntn = el => el.id() !== intnNode.id();
      let pptNodes = source.add( target ).filter( idIsNotIntn );

      let getIntn = () => {
        if( createdIntnNode ){
          controller.addInteraction({
            position: _.clone( intnNode.position() )
          });

          return controller.getLastAddedElement();
        } else {
          return document.get( intnNode.id() );
        }
      };

      let addPpts = intn => Promise.all( pptNodes.map( n => intn.add( document.get( n.id() ) ) ) );

      let rmPreviewEles = () => {
        // remove the edgehandles eles and let the doc listeners create
        // cy elements will full data
        addedEles.remove();
      };

      rmPreviewEles();
      addPpts( getIntn() );
    }
  });

  cy.on('cyedgehandles.start', () => bus.emit('drawstart'));
  cy.on('cyedgehandles.stop', () => bus.emit('drawstop'));

  bus.on('drawon', () => cy.edgehandles('drawon'));
  bus.on('drawoff', () => cy.edgehandles('drawoff'));
  bus.on('drawfrom', el => cy.edgehandles( 'start', el.id() ));

  // TODO edgehandles removehandle
  // bus.on('removehandle', el => cy.edgehandles( 'stop', el.id() ));

  on('d', () => bus.emit('drawtoggle'));
};
