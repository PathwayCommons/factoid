import ReactDom from 'react-dom';
import h from 'react-hyperscript';
import hh from 'hyperscript';
import ElementInfo from '../../element-info/element-info';
import ParticipantInfo from '../../element-info/participant-info';
import tippyjs from 'tippy.js';
import _ from 'lodash';
import { tippyDefaults } from '../../../defs';
import { emitter as popoverEmitter } from '../../popover/popover';

export default function({ bus, cy, document }){
  let isSmallScreen = () => window.innerWidth <= 650;

  let hideAllTippies = (list = '_tippies', event) => {
    cy.elements().forEach( el => hideTippy(el, event, list) );
  };

  let hideAllPopovers = () => popoverEmitter.emit('hide');

  bus.on('closetip', function( el ){
    if( el != null ){
      let id = el.id();
      let ele = cy.getElementById( id );

      hideTippy( ele );
    } else {
      hideAllTippies();
    }
  });

  bus.on('destroytip', () => {
    destroyAllTippies();
  });

  bus.on('opentip', function( el ){
    hideAllTippies();

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

      hideTippy( ele, null, '_pptTippies' );
    } else {
      hideAllTippies('_pptTippies');
    }
  });

  cy.on('pan zoom drag', () => {
    hideAllTippies();
  });

  cy.on('tap', e => {
    if( e.target === cy ){
      hideAllTippies('_tippies', e);
      hideAllPopovers();
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

  const defaultTippyList = '_tippies';

  let hideTippy = (ele, event, list = defaultTippyList) => {
    let isSelected = ele.selected();
    let tippies = ele.scratch(list);
    let didClose = false;

    if( tippies != null ){
      tippies.forEach( t => {
        t.tippy.hide();

        didClose = true;
      });
    }

    // keep the node or edge selected when you just close the tippy popover
    if( didClose && isSelected && event != null && event.type === 'tap' && event.target === cy ){
      setTimeout(() => { // on next tick
        ele.select();
      }, 0);
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
      placement: 'bottom',
      hideOnClick: true, // needs workaround below
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

    // workaround: hideOnClick:true prevents show()
    // cause: a cy event for click is emitted before the original click event bubbles up to the page body
    // approach: use setTimeout() so the show() happens on the tick after the click callback stack is unwound
    setTimeout(() => {
      tippy.show();
    }, 0);

    return tippy;
  };

  let getContentDiv = component => {
    let div = hh('div');

    ReactDom.render( component, div );

    return div;
  };

  let toggleElementInfoFor = ( el, opts = {} ) => {
    let { toggleOn, togglePpts } = _.assign( {
      toggleOn: undefined,
      togglePpts: false
    }, opts );

    let pan = cy.pan();
    let zoom = cy.zoom();

    let event = opts.event;

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
        hideTippy( el, event, '_pptTippies' );
      } else {
        hideTippy( el, event );
      }
    } else {
      if( !togglePpts ){
        hideAllTippies();

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

        let intnTippyAway = false; // disable shifting, since we're currently not using arrow editing

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
            intnTippyAway = false; // we're not currently using arrow editing
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

    toggleElementInfoFor( e.target, { event: e } );
  });
}
