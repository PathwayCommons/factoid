let Cytoscape = require('cytoscape');
let edgehandles = require('cytoscape-edgehandles');
let cxtmenu = require('cytoscape-cxtmenu');
let qtip = require('cytoscape-qtip');
let automove = require('cytoscape-automove');
let cose = require('cytoscape-cose-bilkent');

module.exports = function(){
  [ edgehandles, cxtmenu, qtip, automove, cose ].forEach( ext => Cytoscape.use( ext ) );
};
