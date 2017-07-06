const h = require('react-hyperscript');

module.exports = function(){
  return h('div.editor-help', [
    h('h3', 'Factoid helps authors share their knowledge with the world'),

    h('p', 'Factoid translates written scientific text into formal descriptions of biological processes that are useful for sharing results with others, bioinformatics analysis and integrating with other data to help build a more complete model of a cell.'),

    h('p', 'Factoid 1.0 helps turn text into a simple and editable network model of a biological process in two easy steps:'),

    h('ol.list', [
      h('li', 'Factoid will find genes and simple interactions from your paper.'),
      h('li', 'Correct mistakes Factoid has made:  Ammend incorrect interactions and ensure that all entities are fully specified.  Unspecified entities are highlighted in red.')
    ])
  ]);
};
