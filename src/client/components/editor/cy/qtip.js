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
    let shiftPos = {};

    if( isInteractionNode( node ) && tgt.isEdge() ){
      let intn = connectedNodes.filter( isInteractionNode );
      let ent = connectedNodes.not( intn );

      let pi = intn.renderedPosition();
      let pe = ent.renderedPosition();

      let wi = 2/3;
      let we = 1/3;

      shiftPos = {
        x: pi.x * wi + pe.x * we,
        y: pi.y * wi + pe.y * we
      };
    }

    let timeout;
    let dimsCheckTime = 200;
    let lastHeight = -1;
    let heightThreshold = 4;

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

    tgt.addClass('tooltip-target');

    tgt.qtip({
      content: {
        text: function( /*event, qtipApi*/ ){
          let div = hh('div');

          tgt.scratch('_qtipReactDiv', div);

          ReactDom.render( h( ElementInfo, { element: docEl, bus, document, eventTarget: tgt } ), div );

          return div;
        }
      },
      position: {
        my: 'left center',
        at: 'right center',
        adjust: _.assign( {
          method: 'flip shift'
        }, shiftPos ),
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
          let div = tgt.scratch('_qtipReactDiv');

          if( div != null && div.children.length > 0 ){
            ReactDom.unmountComponentAtNode( div );
          }

          tgt.scratch('_qtipReactDiv', null);

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

    tgt.trigger('showqtip').removeClass('tooltip-target');
  });
};
