import _ from 'lodash';
import Cytoscape from 'cytoscape';
import makeStylesheet from './stylesheet';
import handleLayout from './layout';
import handleViewport from './viewport';
import addEdgehandles from './edgehandles';
import addTippy from './tippy';
import addCompoundDnd from './compound-dnd';
import handleDoc from './doc';
import debug from '../../../debug';
import * as defs from './defs';

function makeCytoscape( opts ){
  const editable = opts.document.editable();
  
  const cy = new Cytoscape({
    container: opts.container,
    style: makeStylesheet( opts.document ),
    minZoom: editable? defs.minZoom : 0.01,
    maxZoom: defs.maxZoom,
    zoom: ( defs.minZoom + defs.maxZoom ) / 2,
    userZoomingEnabled: editable,
    userPanningEnabled: editable,
    boxSelectionEnabled: editable,
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
    addCompoundDnd
  ].forEach( fn => fn( handleOpts ) );

  return cy;
}

export default makeCytoscape;
