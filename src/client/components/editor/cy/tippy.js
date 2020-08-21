import ReactDom from 'react-dom';
import h from 'react-hyperscript';
import hh from 'hyperscript';
import ElementInfo from '../../element-info/element-info';
import tippyjs from 'tippy.js';
import _ from 'lodash';
import { tippyDefaults } from '../../../defs';
import { emitter as popoverEmitter } from '../../popover/popover';

export default function({ bus, cy, document }){
  let hideAllTippies = (list = '_tippies', event) => {
    cy.elements().forEach( el => hideTippy(el, event, list) );
  };

  let hideAllPopovers = () => popoverEmitter.emit('hide');

  // proxy events to bus for r/o view to show/hide tip info
  ['select', 'unselect'].forEach(eventName => {
    cy.on(eventName, e => {
      const el = e.target;
      const docEl = document.get(el.id());
  
      bus.emit(eventName, docEl, el);
    });
  });

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

  cy.on('pan zoom drag', () => {
    hideAllTippies();
  });

  cy.on('touchstart mousedown', e => {
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

    if( !document.editable() ){
      return; // let r/o view handle how to show tip info
    }

    if( tippies != null ){
      tippies.forEach( t => {
        t.tippy.hide();

        didClose = true;
      });
    }

    // keep the node or edge selected when you just close the tippy popover
    if( didClose && isSelected && event != null && event.target === cy ){
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
      flip: true,
      flipBehavior: ['bottom', 'top', 'right', 'left'],
      flipOnUpdate: true,
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

  let toggleElementInfoFor = ( el, opts = {} ) => {
    if( !document.editable() ){
      return; // allow r/o view to handle showing tip info differently
    }

    let { toggleOn } = _.assign( {
      toggleOn: undefined
    }, opts );

    let event = opts.event;

    let mid = bb => ({ x: (bb.x1 + bb.x2)/2, y: (bb.y1 + bb.y2)/2 });
    let pos = mid(el.renderedBoundingBox());
    let docEl = document.get( el.id() );

    let tippies = el.scratch('_tippies');

    if( toggleOn === undefined ){
      toggleOn = tippies == null;
    }

    if( !toggleOn ){
      hideTippy( el, event );
    } else {
      hideAllTippies();

      lastOpenTime = Date.now();

      tippies = [];

      el.scratch('_tippies', tippies);

      if( docEl.isInteraction() ){
        const getBb = () => ({
          x1: pos.x - 1,
          x2: pos.x + 1,
          w: 2,
          y1: pos.y - 1,
          y2: pos.y + 1,
          h: 2
        });

        makeTippy({
          el: el,
          ref: getRef( getBb, el ),
          content: getContentDiv( h( ElementInfo, { element: docEl, bus, document, eventTarget: el.target() } ) )
        });
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
