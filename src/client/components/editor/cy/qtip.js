const anime = require('animejs');
const ReactDom = require('react-dom');
const h = require('react-hyperscript');
const hh = require('hyperscript');
const ElementInfo = require('../../element-info');
const _ = require('lodash');
const { isInteractionNode } = require('../../../../util');

let getQtipDomEle = qtipApi => qtipApi.elements.tooltip[0];

module.exports = function({ bus, cy, document }){
  bus.on('closetip', function( el ){
    if( el != null ){
      let id = el.id();
      let ele = cy.getElementById( id );

      ele.emit('hideqtip');
    } else {
      cy.nodes().emit('hideqtip');
    }
  });

  let drawing = false;

  bus.on('drawstart', () => drawing = true);
  bus.on('drawstop', () => drawing = false);

  cy.on('tap', 'node, edge', function( e ){
    if( drawing || e.originalEvent.shiftKey ){ return; }

    let tgt = e.target;
    let connectedNodes = tgt.connectedNodes();
    let node = tgt.isNode() ? tgt : connectedNodes.filter( isInteractionNode );
    let docEl = document.get( node.id() );
    let qapi;
    let timeout;
    let dimsCheckTime = 200;
    let lastHeight = -1;
    let heightThreshold = 4;
    let qPos = {
      my: 'left center',
      at: 'right center'
    };

    if( tgt.isEdge() ){
      let condNodes = tgt.connectedNodes();
      let intnNode = condNodes.filter( isInteractionNode );
      let entNode = condNodes.not( intnNode );
      let posDiff = entNode.renderedPosition().x - intnNode.renderedPosition().x;
      let threshold = 10;

      if( posDiff > threshold ){
        qPos = {
          my: 'right center',
          at: 'left center'
        };
      }
    }

    let updateDims = () => {
      clearTimeout( timeout );

      let currentHeight = qapi.tooltip[0].clientHeight;
      let beyondThreshold = Math.abs(lastHeight - currentHeight) >= heightThreshold;

      if( beyondThreshold ){
        qapi.reposition();

        lastHeight = currentHeight;
      }

      timeout = setTimeout( updateDims, dimsCheckTime );
    };

    let cancelUpdateDims = () => {
      clearTimeout( timeout );
    };

    node.addClass('tooltip-target');

    node.qtip({
      content: {
        text: function( /*event, qtipApi*/ ){
          let div = hh('div');

          node.scratch('_qtipReactDiv', div);

          ReactDom.render( h( ElementInfo, { element: docEl, bus, document, eventTarget: tgt } ), div );

          return div;
        }
      },
      position: {
        my: qPos.my,
        at: qPos.at,
        adjust: {
          method: 'flip shift'
        },
        effect: function( qtipApi, pos ){
          let domEl = getQtipDomEle( qtipApi );

          anime({ targets: domEl, top: pos.top, left: pos.left, duration: 250, easing: 'easeOutQuad' });
        }
      },
      show: {
        event: 'showqtip'
      },
      hide: {
        event: 'hideqtip unfocus'
      },
      events: {
        show: function( showEvent, qtipApi ){
          let domEl = getQtipDomEle( qtipApi );

          anime({ targets: domEl, opacity: [0, 1], duration: 250 });

          qapi = qtipApi;

          updateDims();
        },
        hide: function( hideEvent, qtipApi ){
          let div = node.scratch('_qtipReactDiv');

          if( div != null && div.children.length > 0 ){
            ReactDom.unmountComponentAtNode( div );
          }

          node.scratch('_qtipReactDiv', null);

          cancelUpdateDims();

          qtipApi.destroy( true );
        }
      },
      style: {
        classes: 'qtip-bootstrap',
        tip: {
          width: 16,
          height: 8
        }
      }
    });

    node.trigger('showqtip').removeClass('tooltip-target');
  });
};
