let _ = require('lodash');
let Cytoscape = require('cytoscape');
let makeStylesheet = require('./stylesheet');
let handleLayout = require('./layout');
let handleViewport = require('./viewport');
let addEdgehandles = require('./edgehandles');
let addCxtMenu = require('./cxtmenu');
let addTippy = require('./tippy');
let addAutomove = require('./automove');
let handleDoc = require('./doc');
let debug = require('../../../debug');
let defs = require('./defs');

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
    addCxtMenu
  ].forEach( fn => fn( handleOpts ) );

  return cy;
}

module.exports = makeCytoscape;
