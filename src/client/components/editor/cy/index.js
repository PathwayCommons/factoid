let _ = require('lodash');
let Cytoscape = require('cytoscape');
let makeStylesheet = require('./stylesheet');
let handleLayout = require('./layout');
let handleViewport = require('./viewport');
let addEdgehandles = require('./edgehandles');
let addCxtMenu = require('./cxtmenu');
let addQtip = require('./qtip');
let addAutomove = require('./automove');
let handleDoc = require('./doc');
let { makeCyEles } = require('./make-cy-eles');
let debug = require('../../../debug');
let defs = require('./defs');

function makeCytoscape( opts ){
  let cy = new Cytoscape({
    container: opts.container,
    style: makeStylesheet(),
    minZoom: defs.minZoom,
    maxZoom: defs.maxZoom,
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
    addQtip,
    handleDoc,
    addAutomove,
    addCxtMenu
  ].forEach( fn => fn( handleOpts ) );

  return cy;
}

module.exports = makeCytoscape;
