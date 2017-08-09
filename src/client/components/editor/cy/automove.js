let isPreviewEle = ele => ele.hasClass('edgehandles-preview') || ele.hasClass('edgehandles-ghost');
let notIsPreviewEle = ele => !isPreviewEle( ele );
let { isInteractionNode } = require('../../../../util');

module.exports = function( { cy, document } ){
  let update = node => {
    if( isInteractionNode( node ) ){
      let intn = document.get( node.id() );

      if( intn == null ){
        return;
      } else if( node.removed() ){
        disable( node );
      } else if(
        notIsPreviewEle(node) &&
        node.connectedEdges().filter( notIsPreviewEle ).length >= 2
      ){
        disable( node ); // disable old rules so they can be replaced
        enable( node );
      } else {
        disable( node );
      }
    }
  };

  let enable = node => {
    let nhoodNodes = node.neighborhood().filter( ele => {
      return ( ele.isNode() && notIsPreviewEle( ele ) && !isInteractionNode( ele )
        && ele.edgesWith( node ).filter( notIsPreviewEle ).nonempty() );
    } );

    let mean = cy.automove({
      nodesMatching: node,
      reposition: 'mean',
      meanIgnores: node => !nhoodNodes.has( node ),
      meanOnSelfPosition: () => false
    });

    let drag = cy.automove({
      nodesMatching: nhoodNodes,
      reposition: 'drag',
      dragWith: node
    });

    node.scratch('_automoveRules', [ mean, drag ]);
  };

  let disable = node => {
    let rules = node.scratch('_automoveRules');

    if( !rules ){ return; }

    rules.forEach( rule => rule.disable() );

    node.scratch('_automoveRules', null);
  };

  cy.on('add remove', 'node', function( e ){
    update( e.target );
  });

  cy.on('add remove', 'edge', function( e ){
    let edge = e.target;

    update( edge.target() );
    update( edge.source() );
  });

  cy.nodes().forEach( update );

  let updateRules = node => {
    let rules = node.scratch('_automoveRules') || [];

    rules.forEach( r => r.apply() );
  };

  cy.on('layoutstop', function(){
    cy.nodes().forEach( updateRules );
  });
};
