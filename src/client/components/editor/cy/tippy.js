const ReactDom = require('react-dom');
const h = require('react-hyperscript');
const hh = require('hyperscript');
const ElementInfo = require('../../element-info');
const ParticipantInfo = require('../../participant-info');
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

  cy.on('pan zoom drag', hideAllTippies);

  cy.on('tap', e => {
    if( e.target === cy ){ hideAllTippies(); }
  });

  let drawing = false;

  bus.on('drawstart', () => {
    drawing = true;

    hideAllTippies();
  });
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

  let hideTippy = ele => {
    let tippies = ele.scratch('_tippies');

    if( tippies != null ){
      tippies.forEach( t => t.tippy.hide( t.popper ) );
    }
  };

  cy.on('hidetippy', 'node, edge', function(e){
    hideTippy( e.target );
  });

  cy.on('tap', 'node, edge', function( e ){
    if( drawing || e.originalEvent.shiftKey ){ return; }

    let tgt = e.target;
    let connectedNodes = tgt.connectedNodes();
    let node = tgt.isNode() ? tgt : connectedNodes.filter( isInteractionNode );
    let docEl = document.get( node.id() );

    let getContentDiv = component => {
      let div = hh('div');

      ReactDom.render( component, div );

      return div;
    };

    let getRef = (bb, el) => {
      let bbFn;

      if( _.isFunction(bb) ){
        bbFn = bb;
        bb = bb();
      }

      let updateStyle = div => {
        if( bbFn != null ){
          bb = bbFn();
        }

        let width = bb.w;
        let height = bb.h;
        let left = bb.x1;
        let top = bb.y1;
        let style = `position: absolute; left: ${left}px; top: ${top}px; width: ${width}px; height: ${height}px; z-index: -1; pointer-events: none;`;

        div.setAttribute( 'style',style );
      };

      let div = hh('div.tippy-dummy-ref');

      updateStyle( div );

      if( el != null ){
        el.on( 'position', _.debounce( () => updateStyle(div), 500 ) );
      }

      cy.container().appendChild( div );

      return div;
    };

    let tippies = node.scratch('_tippies');

    if( tippies != null ){
      tippies.forEach( t => t.tippy.hide( t.popper ) );
    } else {
      hideAllTippies();

      tippies = [];

      node.scratch('_tippies', tippies);

      let options = {
        duration: 0,
        position: 'right',
        hideOnClick: false,
        onHidden: _.debounce( () => destroyTippy( node ), 100 ) // debounce allows toggling a tippy on an ele
      };

      let makeTippy = ({ ref, content, overrides }) => {
        let tippy = new Tippy( ref, _.assign( {}, tippyDefaults, options, overrides, {
          html: content
        } ) );

        let popper = tippy.getPopperElement( ref );

        tippies.push({ tippy, popper, content });

        tippy.show( popper );
      };

      if( docEl.isInteraction() ){
        let bottomOfCyBb = {
          w: cy.width(),
          h: 1,
          x1: 0,
          x2: cy.width(),
          y1: cy.height() - 1,
          y2: cy.height()
        };

        makeTippy({
          ref: getRef( bottomOfCyBb ),
          content: getContentDiv( h( ElementInfo, { element: docEl, bus, document, eventTarget: tgt } ) ),
          overrides: {
            position: 'bottom',
            arrow: false
          }
        });

        let pan = cy.pan();
        let zoom = cy.zoom();

        let modelToRenderedPt = p => {
          return {
            x: p.x * zoom + pan.x,
            y: p.y * zoom + pan.y
          };
        };

        docEl.participants().forEach( ppt => {
          let pptNode = cy.getElementById( ppt.id() );
          let edge = pptNode.edgesWith( cy.getElementById( docEl.id() ) );

          let getArrowBb = () => {
            let arrowPos = modelToRenderedPt( edge.targetEndpoint() );

            let arrowBb = {
              w: 3,
              h: 3,
              x1: arrowPos.x - 1,
              x2: arrowPos.x + 1,
              y1: arrowPos.y - 1,
              y2: arrowPos.y + 1
            };

            return arrowBb;
          };

          let pos;
          let pSrc = edge.source().position();
          let pTgt = edge.target().position();
          let dx = pTgt.x - pSrc.x;
          let dy = pTgt.y - pSrc.y;

          if( Math.abs(dx) > Math.abs(dy) ){
            pos = 'top';
          } else {
            pos = 'right';
          }

          makeTippy({
            ref: getRef( getArrowBb, pptNode ),
            content: getContentDiv( h( ParticipantInfo, { interaction: docEl, participant: ppt, bus, document, eventTarget: tgt } ) ),
            overrides: {
              distance: 5 * zoom,
              position: pos
            }
          });
        } );
      } else {
        makeTippy({
          ref: getRef( () => node.renderedBoundingBox({ includeLabels: false }), node ),
          content: getContentDiv( h( ElementInfo, { element: docEl, bus, document, eventTarget: tgt } ) )
        });
      }
    }

  });
};
