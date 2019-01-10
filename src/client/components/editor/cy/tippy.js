const ReactDom = require('react-dom');
const h = require('react-hyperscript');
const hh = require('hyperscript');
const ElementInfo = require('../../element-info/element-info');
const ParticipantInfo = require('../../element-info/participant-info');
const tippyjs = require('tippy.js');
const _ = require('lodash');
const { tippyDefaults } = require('../../../defs');
const NotificationBase = require('../../notification/base');
const Notification = require('../../notification/notification');

module.exports = function({ bus, cy, document }){
  let isSmallScreen = () => window.innerWidth <= 650;

  let hideAllTippies = (list = '_tippies') => {
    cy.elements().forEach( el => hideTippy(el, list) );
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

  bus.on('destroytip', () => {
    destroyAllTippies();
  });

  bus.on('opentip', function( el ){
    hideAllTippies();
    deactivateIncompleteNotification();

    if( el != null ){
      toggleElementInfoFor( cy.getElementById( el.id() ) );
    }
  });

  bus.on('openpptstip', function( el ){
    if( el != null ){
      toggleElementInfoFor( cy.getElementById( el.id() ), { togglePpts: true, toggleOn: true } );
    }
  });

  bus.on('closepptstip', function( el ){
    if( el != null ){
      let id = el.id();
      let ele = cy.getElementById( id );

      hideTippy( ele, '_pptTippies' );
    } else {
      hideAllTippies('_pptTippies');
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
  let ehStopTime = 0;
  let lastOpenTime = 0;

  bus.on('drawstart', () => {
    drawing = true;

    hideAllTippies();
  });

  bus.on('drawstop', () => drawing = false);

  cy.on('ehstop', () => ehStopTime = Date.now());

  let destroyAllTippies = () => {
    cy.elements().forEach( n => {
      let infos = n.scratch('_tippies');

      if( infos ){
        infos.forEach( destroyTippy );
      }
    } );

    destroyTippy( incompleteTippyInfo );
  };

  let destroyTippy = tippyInfo => {
    if( !tippyInfo ){ return; }

    let t = tippyInfo;
    let div = t.content;
    let refDiv = t.tippy.reference;

    t.tippy.destroy();

    ReactDom.unmountComponentAtNode( div );

    let rm = div => {
      try {
        div.parentNode.removeChild( div );
      } catch( err ){
        // just let it fail
      }
    };

    rm(div);
    rm(refDiv);
  };

  let destroyTippyFor = (ele, sublist = '_tippies') => {
    let tippies = ele.scratch(sublist);

    ele.scratch(sublist, null);

    if( tippies != null ){
      tippies.forEach( destroyTippy );
    }
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
    toggleElementInfoFor( incompleteTippyInfo.el, { toggleOn: true } );
  });

  let makeIncompleteNotification = (el, docEl) => { // eslint-disable-line no-unused-vars
    if( !document.editable() ){ return; }

    let ref = getRef( () => el.renderedBoundingBox({ includeLabels: true, includeOverlays: false }), el );
    let content = getContentDiv( h( NotificationBase, {
      notification: incompleteNotification,
      className: 'incomplete-entity-notification'
    } ) );

    let type = docEl.isInteraction() ? 'interaction' : 'entity';

    incompleteNotification.message(`Complete this ${type}.`);

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

  let hideTippy = (ele, list = '_tippies') => {
    let tippies = ele.scratch(list);
    let didClose = false;

    if( tippies != null ){
      tippies.forEach( t => {
        t.tippy.hide();

        didClose = true;
      });
    }

    if( didClose && list !== '_pptTippies' ){
      let docEl = document.get( ele.id() );

      if( docEl && !docEl.completed() ){
        makeIncompleteNotification( ele, docEl );
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

  let makeTippy = ({ el, ref, content, overrides, sublist }) => {
    let tippy = tippyjs( ref, _.assign( {}, tippyDefaults, {
      duration: 0,
      placement: isSmallScreen() ? 'bottom' : 'right',
      hideOnClick: false,
      sticky: true,
      livePlacement: true,
      onHidden: _.debounce( () => destroyTippyFor( el, sublist ), 100 ) // debounce allows toggling a tippy on an ele
    }, overrides, {
      html: content
    } ) ).tooltips[0];

    let addToList = listName => {
      let tippies = el.scratch(listName);

      if( tippies == null ){
        tippies = [];
        el.scratch(listName, tippies);
      }

      tippies.push({ tippy, content });
    };

    addToList('_tippies');

    if( sublist ){
      addToList(sublist);
    }

    tippy.show();

    return tippy;
  };

  let getContentDiv = component => {
    let div = hh('div');

    ReactDom.render( component, div );

    return div;
  };

  let toggleElementInfoFor = ( el, opts ) => {
    let { toggleOn, togglePpts } = _.assign( {
      toggleOn: undefined,
      togglePpts: false
    }, opts );

    let pan = cy.pan();
    let zoom = cy.zoom();

    let modelToRenderedPt = p => {
      return {
        x: p.x * zoom + pan.x,
        y: p.y * zoom + pan.y
      };
    };

    let mid = bb => ({ x: (bb.x1 + bb.x2)/2, y: (bb.y1 + bb.y2)/2 });
    let pos = mid(el.renderedBoundingBox());
    let vpW = cy.width();
    let vpH = cy.height();
    let docEl = document.get( el.id() );

    let tippies = el.scratch('_tippies');

    if( toggleOn === undefined ){
      toggleOn = tippies == null;
    }

    if( !toggleOn ){
      if( togglePpts ){
        hideTippy( el, '_pptTippies' );
      } else {
        hideTippy( el );
      }
    } else {
      if( !togglePpts ){
        hideAllTippies();
        deactivateIncompleteNotification();

        lastOpenTime = Date.now();

        tippies = [];

        el.scratch('_tippies', tippies);
      } else {
        el.scratch('_pptTippies', []);
      }

      if( docEl.isInteraction() ){
        let isVertical;
        let ppts = docEl.participants();
        let srcNode = el.source();
        let tgtNode = el.target();

        let pSrc = srcNode.position();
        let pTgt = tgtNode.position();

        let dx = pTgt.x - pSrc.x;
        let dy = pTgt.y - pSrc.y;

        if( Math.abs(dx) > Math.abs(dy) ){
          isVertical = false;
        } else {
          isVertical = true;
        }

        let flipIntnTippy = (isVertical && pos.x > vpW/2) || (!isVertical && pos.y > vpH/2);

        if( isSmallScreen() ){
          isVertical = false;
          flipIntnTippy = false;
        }

        let edgesBb = el.add(el.connectedNodes()).renderedBoundingBox();

        let intnTippyAway = true; // always shift

        let getIntnTippyBb = () => {
          let bb = el.isNode () ? el.renderedBoundingBox({ includeLabels: false, includeOverlays: false }) : {
            x1: pos.x - 1,
            x2: pos.x + 1,
            w: 2,
            y1: pos.y - 1,
            y2: pos.y + 1,
            h: 2
          };

          bb = _.assign( {}, bb ); // copy

          if( intnTippyAway ){
            let minDist = 40;
            let maxDist = 100;
            let defDist = isVertical ? edgesBb.w/2 : edgesBb.h/2;
            let dist = Math.min( maxDist, Math.max( minDist, defDist ) ) - bb.w/2;

            let dblDist = dist * 2;

            bb.w += dblDist;
            bb.h += dblDist;
            bb.x1 -= dist;
            bb.x2 += dist;
            bb.y1 -= dist;
            bb.y2 += dist;
          }

          return bb;
        };

        if( !togglePpts ){
          makeTippy({
            el: el,
            ref: getRef( getIntnTippyBb, el ),
            content: getContentDiv( h( ElementInfo, { element: docEl, bus, document, eventTarget: tgtNode } ) ),
            overrides: {
              distance: 10,
              placement: isVertical ? (flipIntnTippy ? 'left' : 'right') : (flipIntnTippy ? 'top' : 'bottom'),
              duration: [250, 0]
            }
          });

          // cause tippy to animate a distance away
          setTimeout(() => {
            intnTippyAway = true;
          }, 1);
        } else {
          ppts.forEach( ppt => {
            if( !document.editable() ){ return; }

            let pptNode = cy.getElementById( ppt.id() );
            let edge = el;

            let getArrowBb = () => {
              let arrowPos = modelToRenderedPt( ppt.id() === tgtNode.id() ? edge.targetEndpoint() : edge.sourceEndpoint() );

              let arrowBb = {
                w: 2,
                h: 2,
                x1: arrowPos.x - 1,
                x2: arrowPos.x + 1,
                y1: arrowPos.y - 1,
                y2: arrowPos.y + 1
              };

              return arrowBb;
            };

            makeTippy({
              el: el,
              ref: getRef( getArrowBb, pptNode ),
              content: getContentDiv( h( ParticipantInfo, { interaction: docEl, participant: ppt, bus, document, eventTarget: tgtNode } ) ),
              overrides: {
                distance: 10 + 5 * zoom,
                placement: isVertical ? (flipIntnTippy ? 'right' : 'left') : (flipIntnTippy ? 'bottom' : 'top'),
                animation: 'shift-away',
                duration: [250, 0]
              },
              sublist: '_pptTippies'
            });
          } ); // for each ppts
        } // if toggle ppts
      } else { // entity
        makeTippy({
          el: el,
          ref: getRef( () => el.renderedBoundingBox({ includeLabels: true, includeOverlays: false }), el ),
          content: getContentDiv( h( ElementInfo, { element: docEl, bus, document, eventTarget: el } ) )
        });
      }
    } // if toggle on
  };

  cy.on('tap', 'node, edge', function( e ){
    let justMadeEhWithTap = Date.now() - ehStopTime < 100;
    let justOpened = Date.now() - lastOpenTime < 500;
    let isEdgeHandle = e.target.hasClass('eh-handle');
    let shiftDown = e.originalEvent.shiftKey;

    if( justMadeEhWithTap || drawing || shiftDown || justOpened || isEdgeHandle){
      return;
    }

    toggleElementInfoFor( e.target );
  });
};
