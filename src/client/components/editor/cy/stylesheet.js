let defs = require('./defs');

function makeStylesheet(){
  let { activeColor, defaultColor, labelColor, nodeSize, interactionNodeSize } = defs;

  return [
    {
      selector: 'node',
      style: {
        'background-color': defaultColor,
        'width': nodeSize,
        'height': nodeSize,
        'label': 'data(name)',
        'text-outline-width': 2,
        'text-outline-color': defaultColor,
        'color': labelColor,
        'text-valign': 'center',
        'text-halign': 'center'
      }
    },
    {
      selector: 'node[!isInteraction][!associated]',
      style: {
        'border-style': 'double',
        'border-color': 'red',
        'border-width': 2
      }
    },
    {
      selector: 'node[!isInteraction][?associated]',
      style: {
        'border-width': 0
      }
    },
    {
      selector: 'node[?isInteraction]',
      style: {
        'shape': 'roundrectangle',
        'width': interactionNodeSize,
        'height': interactionNodeSize,
        'label': ''
      }
    },
    {
      selector: 'node:selected',
      style: {
        'background-color': activeColor,
        'text-outline-color': activeColor,
      }
    },
    {
      selector: 'edge',
      style: {
        'width': 2,
        'curve-style': 'bezier',
        'line-color': defaultColor,
        'target-arrow-color': defaultColor,
        'source-arrow-color': defaultColor,
        'source-endpoint': 'inside-to-node',
        'target-endpoint': 'inside-to-node'
      }
    },
    {
      selector: 'edge:selected',
      style: {
        'line-color': activeColor
      }
    },
    {
      selector: '.edgehandles-preview, .edgehandles-ghost-edge',
      style: {
        'background-color': activeColor,
        'line-color': activeColor,
        'target-arrow-color': activeColor,
        'source-arrow-color': activeColor
      }
    },
    {
      selector: '.edgehandles-ghost-edge',
      style: {
        'opacity': 0.5
      }
    },
    {
      selector: '.cxtmenu-tgt',
      style: {
        'overlay-opacity': 0
      }
    }
  ];
}

module.exports = makeStylesheet;
