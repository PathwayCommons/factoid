const ReactDom = require('react-dom');
const h = require('react-hyperscript');
const hh = require('hyperscript');
const ElementInfo = require('../../element-info');
const ParticipantInfo = require('../../participant-info');
const { isInteractionNode } = require('../../../../util');
const tippyjs = require('tippy.js');
const _ = require('lodash');
const { tippyDefaults } = require('../../../defs');
const NotificationBase = require('../../notification/base');
const Notification = require('../../notification/notification');

module.exports = function({ bus, cy, document }){
  let hideAllTippies = () => {
    cy.nodes().forEach( hideTippy );
  };

  bus.on('closetip', function( el ){
    if( el != null ){
      let id = el.id();
      let ele = cy.getElementById( id );

      hideTippy( ele );
    } else {
      hideAllTippies();
    }

    deactivateIncompleteNotification();
  });

  bus.on('opentip', function( el ){
    hideAllTippies();
    deactivateIncompleteNotification();

    if( el != null ){
      toggleElementInfoFor( cy.getElementById( el.id() ) );
    }
  });

  cy.on('pan zoom drag', () => {
    hideAllTippies();
    deactivateIncompleteNotification();
  });

  cy.on('tap', e => {
    if( e.target === cy ){
      deactivateIncompleteNotification();
      hideAllTippies();
    }
  });

  let drawing = false;

  bus.on('drawstart', () => {
    drawing = true;

    hideAllTippies();
  });
  bus.on('drawstop', () => drawing = false);

  let destroyTippy = tippyInfo => {
    let t = tippyInfo;
    let div = t.content;

    t.tippy.hide();

    ReactDom.unmountComponentAtNode( div );

    div.parentNode.removeChild( div );
  };

  let destroyTippyFor = ele => {
    let tippies = ele.scratch('_tippies');

    ele.scratch('_tippies', null);

    if( tippies != null ){
      tippies.forEach( destroyTippy );
    }
  };

  let getTippyNode = ele => {
    return ele.isNode() ? ele : ele.connectedNodes().filter( isInteractionNode );
  };

  let incompleteNotification = new Notification({
    openable: true,
    openText: 'Open'
  });

  let incompleteTippyInfo = null;

  incompleteNotification.on('deactivate', () => {
    if( incompleteTippyInfo != null ){
      destroyTippy( incompleteTippyInfo );

      incompleteTippyInfo = null;
    }
  });

  incompleteNotification.on('open', () => {
    toggleElementInfoFor( incompleteTippyInfo.el, true );
  });

  let makeIncompleteNotification = (el, docEl) => { // eslint-disable-line no-unused-vars
    let ref = getRef( () => el.renderedBoundingBox({ includeLabels: true, includeOverlays: false }), el );
    let content = getContentDiv( h( NotificationBase, {
      notification: incompleteNotification,
      className: 'incomplete-entity-notification'
    } ) );

    incompleteNotification.message(`Complete this entity.`);

    incompleteNotification.activate();

    if( incompleteTippyInfo != null ){
      destroyTippy( incompleteTippyInfo );
    }

    let tippy = tippyjs( ref, _.assign( {}, tippyDefaults, {
      duration: 0,
      theme: 'dark',
      placement: 'top',
      hideOnClick: false,
      html: content
    } ) ).tooltips[0];

    let tippyInfo = { tippy, content, el };

    incompleteTippyInfo = tippyInfo;

    tippy.show();
  };

  let deactivateIncompleteNotification = () => {
    if( incompleteNotification != null && incompleteNotification.active() ){
      incompleteNotification.deactivate();
    }
  };

  let hideTippy = ele => {
    let node = getTippyNode( ele );
    let tippies = node.scratch('_tippies');
    let didClose = false;

    if( tippies != null ){
      tippies.forEach( t => {
        t.tippy.hide();

        didClose = true;
      });
    }

    if( didClose && !isInteractionNode(node) ){
      let docEl = document.get( node.id() );

      if( docEl && !docEl.completed() ){
        makeIncompleteNotification( node, docEl );
      }
    }
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
      let update = _.debounce( () => updateStyle(div), 200 );

      el.on( 'position', update );
      el.on( 'style', update );
    }

    cy.container().appendChild( div );

    return div;
  };

  let makeTippy = ({ el, ref, content, overrides }) => {
    let tippy = tippyjs( ref, _.assign( {}, tippyDefaults, {
      duration: 0,
      placement: 'right',
      hideOnClick: false,
      onHidden: _.debounce( () => destroyTippyFor( el ), 100 ) // debounce allows toggling a tippy on an ele
    }, overrides, {
      html: content
    } ) ).tooltips[0];

    let tippies = el.scratch('_tippies');

    if( tippies == null ){
      tippies = [];
      el.scratch('_tippies', tippies);
    }

    tippies.push({ tippy, content });

    tippy.show();
  };

  let getContentDiv = component => {
    let div = hh('div');

    ReactDom.render( component, div );

    return div;
  };

  let toggleElementInfoFor = ( tgt, toggleOn ) => {
    let node = getTippyNode( tgt );
    let docEl = document.get( node.id() );

    let tippies = node.scratch('_tippies');

    if( toggleOn === undefined ){
      toggleOn = tippies == null;
    }

    if( !toggleOn ){
      hideTippy( node );
    } else {
      hideAllTippies();
      deactivateIncompleteNotification();

      tippies = [];

      node.scratch('_tippies', tippies);

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
          el: node,
          ref: getRef( bottomOfCyBb ),
          content: getContentDiv( h( ElementInfo, { element: docEl, bus, document, eventTarget: tgt } ) ),
          overrides: {
            placement: 'bottom',
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
            el: node,
            ref: getRef( getArrowBb, pptNode ),
            content: getContentDiv( h( ParticipantInfo, { interaction: docEl, participant: ppt, bus, document, eventTarget: tgt } ) ),
            overrides: {
              distance: 5 * zoom,
              placement: pos
            }
          });
        } );
      } else {
        makeTippy({
          el: node,
          ref: getRef( () => node.renderedBoundingBox({ includeLabels: true, includeOverlays: false }), node ),
          content: getContentDiv( h( ElementInfo, { element: docEl, bus, document, eventTarget: tgt } ) )
        });
      }
    }
  };

  cy.on('tap', 'node, edge', function( e ){
    if( drawing || e.originalEvent.shiftKey ){ return; }

    toggleElementInfoFor( e.target );
  });
};
