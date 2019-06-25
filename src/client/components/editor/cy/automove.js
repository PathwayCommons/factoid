const isEhNode = ele => ele.hasClass('eh-handle') || ele.hasClass('eh-ghost');
const notIsEhNode = ele => !isEhNode( ele );
const isEhEdge = ele => ele.hasClass('eh-preview') || ele.hasClass('eh-ghost');
const notIsEhEdge = ele => !isEhEdge( ele );
import { isInteractionNode } from '../../../../util';

const ALLOW_DRAGGING_INTERACTIONS = false;

export default function( { cy, document } ){
  let update = node => {
    if( isInteractionNode( node ) ){
      let intn = document.get( node.id() );

      if( intn == null ){
        disable( node );
      } else if( node.removed() ){
        disable( node );
      } else if(
        notIsEhNode(node) &&
        node.connectedEdges().filter( notIsEhEdge ).length >= 2
      ){
        disable( node ); // disable old rules so they can be replaced
        enable( node );
      } else {
        disable( node );
      }
    }
  };

  let enable = node => {
    let rules = [];

    let nhoodNodes = node.neighborhood().filter( ele => {
      return ( ele.isNode() && notIsEhNode( ele ) && !isInteractionNode( ele )
        && ele.edgesWith( node ).filter( notIsEhEdge ).nonempty() );
    } );

    let mean = cy.automove({
      nodesMatching: node,
      reposition: 'mean',
      meanIgnores: node => !nhoodNodes.has( node ),
      meanOnSelfPosition: () => false
    });

    rules.push( mean );

    if( ALLOW_DRAGGING_INTERACTIONS ){
      let drag = cy.automove({
        nodesMatching: nhoodNodes,
        reposition: 'drag',
        dragWith: node
      });

      rules.push( drag );
    }

    node.scratch('_automoveRules', rules);

  };

  let disable = node => {
    let rules = node.scratch('_automoveRules');

    if( !rules ){ return; }

    rules.forEach( rule => {
      rule.disable();
      rule.destroy();
    } );

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

}
