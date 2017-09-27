const ReactDom = require('react-dom');
const h = require('react-hyperscript');
const hh = require('hyperscript');
const ElementInfo = require('../../element-info');
const { isInteractionNode } = require('../../../../util');
const Tippy = require('tippy.js');
const _ = require('lodash');
const { tippyDefaults } = require('../../../defs');

module.exports = function({ bus, cy, document }){
  let hideAllTippies = () => {
    cy.nodes().emit('hidetippy');
  };

  bus.on('closetip', function( el ){
    if( el != null ){
      let id = el.id();
      let ele = cy.getElementById( id );

      ele.emit('hidetippy');
    } else {
      hideAllTippies();
    }
  });

  cy.on('pan zoom drag grab tapstart', hideAllTippies);

  let drawing = false;

  bus.on('drawstart', () => drawing = true);
  bus.on('drawstop', () => drawing = false);

  let destroyTippy = ele => {
    let tippies = ele.scratch('_tippies');

    ele.scratch('_tippies', null);

    if( tippies != null ){
      tippies.forEach( t => {
        let div = t.content;

        div.parentNode.removeChild( div );
        ReactDom.unmountComponentAtNode( div );
      } );
    }
  };

  cy.on('hidetippy', 'node, edge', function(e){
    let ele = e.target;
    let tippies = ele.scratch('_tippies');

    if( tippies != null ){
      tippies.forEach( t => t.tippy.hide( t.popper ) );
    }
  });

  cy.on('tap', 'node, edge', function( e ){
    if( drawing || e.originalEvent.shiftKey ){ return; }

    let tgt = e.target;
    let connectedNodes = tgt.connectedNodes();
    let node = tgt.isNode() ? tgt : connectedNodes.filter( isInteractionNode );
    let docEl = document.get( node.id() );

    let getContentDiv = () => {
      let div = hh('div');

      ReactDom.render( h( ElementInfo, { element: docEl, bus, document, eventTarget: tgt } ), div );

      return div;
    };

    let getRef = () => {
      let bb = isInteractionNode(node) ? node.connectedEdges().renderedBoundingBox() : node.renderedBoundingBox({ includeLabels: false });
      let width = bb.w;
      let height = bb.h;
      let left = bb.x1;
      let top = bb.y1;

      let div = hh('div.tippy-dummy-ref', {
        style: `position: absolute; left: ${left}px; top: ${top}px; width: ${width}px; height: ${height}px; z-index: -1; pointer-events: none;`
      });

      cy.container().appendChild( div );

      return div;
    };

    let tippies = node.scratch('_tippies');

    if( tippies != null ){
      tippies.forEach( t => t.tippy.hide( t.popper ) );
    } else {
      tippies = [];

      node.scratch('_tippies', tippies);

      let options = {
        position: 'right',
        hideOnClick: false,
        onHidden: _.debounce( () => destroyTippy( node ), 100 ) // debounce allows toggling a tippy on an ele
      };

      let ref = getRef();
      let content = getContentDiv();

      let tippy = new Tippy( ref, _.assign( {}, tippyDefaults, options, {
        html: content
      } ) );

      let popper = tippy.getPopperElement( ref );

      tippies.push({ tippy, popper, content });

      tippy.show( popper );
    }

  });
};
