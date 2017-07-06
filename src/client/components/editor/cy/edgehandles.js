let on = require('./on-key');
let defs = require('./defs');
let uuid = require('uuid');
let _ = require('lodash');
let Promise = require('bluebird');

let isInteraction = node => node.data('isInteraction') ? true : false;

module.exports = function({ bus, cy, document, controller }){
  if( !document.editable() ){ return; }

  cy.edgehandles({
    handleNodes: 'node',
    handleSize: 10,
    handleHitThreshold: 6,
    handleColor: defs.activeColor,
    handleOutlineColor: '#fff',
    handleOutlineWidth: 1,
    toggleOffOnLeave: true,
    edgeType: function( source, target ){
      if( source.edgesWith( target ).length > 0 ){
        return null;
      } if( isInteraction( source ) || isInteraction( target ) ){
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
          isEntity: false
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
      let intnNode = createdIntnNode ? addedNodes : isInteraction( source ) ? source : target;
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

      let addPpts = intn => Promise.all( pptNodes.map( n => intn.add( document.get( n.id() ) ) ) );

      let rmPreviewEles = () => {
        // remove the edgehandles eles and let the doc listeners create
        // cy elements will full data
        addedEles.remove();
      };

      // TODO batching causes cy rendering bug
      let start = () => {
        //cy.startBatch();
      };

      let done = () => {
        //cy.endBatch();
      };

      Promise.try( start ).then( rmPreviewEles ).then( getIntn ).then( addPpts ).then( done );
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
