let anime = require('animejs');
let ReactDom = require('react-dom');
let h = require('react-hyperscript');
let hh = require('hyperscript');
let ElementInfo = require('../../element-info');

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

  cy.on('tap', 'node', function( e ){
    if( drawing || e.originalEvent.shiftKey ){ return; }

    let node = e.target;
    let docEl = document.get( node.id() );
    let qapi;

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

    node.addClass('tooltip-target');

    node.qtip({
      content: {
        text: function( /*event, qtipApi*/ ){
          let div = hh('div');

          node.scratch('_qtipReactDiv', div);

          ReactDom.render( h( ElementInfo, { element: docEl, bus, document } ), div );

          return div;
        }
      },
      position: {
        my: 'left center',
        at: 'right center',
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
