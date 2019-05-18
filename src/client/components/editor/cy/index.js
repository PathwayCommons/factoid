import _ from 'lodash';
import Cytoscape from 'cytoscape';
import makeStylesheet from './stylesheet';
import handleLayout from './layout';
import handleViewport from './viewport';
import addEdgehandles from './edgehandles';
import addCxtMenu from './cxtmenu';
import addTippy from './tippy';
import addAutomove from './automove';
import addCompoundDnd from './compound-dnd';
import handleDoc from './doc';
import debug from '../../../debug';
import * as defs from './defs';

function makeCytoscape( opts ){
  let cy = new Cytoscape({
    container: opts.container,
    style: makeStylesheet( opts.document ),
    minZoom: defs.minZoom,
    maxZoom: defs.maxZoom,
    zoom: ( defs.minZoom + defs.maxZoom ) / 2,
    elements: [],
    layout: {
      name: 'preset',
      fit: false
    }
  });

  if( debug.enabled() ){
    window.cy = cy;
  }

  let handleOpts = _.assign( { cy }, opts );

  [
    handleLayout,
    handleViewport,
    addEdgehandles,
    addTippy,
    handleDoc,
    addAutomove,
    addCxtMenu,
    addCompoundDnd
  ].forEach( fn => fn( handleOpts ) );

  return cy;
}

export default makeCytoscape;
