const defs = require('./defs');
const _ = require('lodash');

function makeStylesheet(){
  let { activeColor, defaultColor, labelColor, nodeSize } = defs;

  return [
    {
      selector: 'node',
      style: {
        'background-color': defaultColor,
        'width': nodeSize,
        'height': nodeSize,
        'label': function( node ){
          let name = node.data('name');
          let mod = node.data('modification');
          let completed = node.data('completed');

          if( !completed ){
            return '?';
          } else if( mod == null || mod === 'unmodified' ){
            return name;
          } else {
            return mod.charAt(0).toLowerCase() + '-' + name;
          }
        },
        'font-size': 10,
        'text-outline-width': 2,
        'text-outline-color': defaultColor,
        'color': labelColor,
        'text-valign': 'center',
        'text-halign': 'center',
        'z-index': 1
      }
    },
    {
      selector: 'node[?isInteraction]',
      style: {
        'shape': 'ellipse',
        'width': 3,
        'height': 3,
        'label': '',
        'events': 'no',
        'z-index': 0
      }
    },
    {
      selector: 'node:selected',
      style: {
        'background-color': activeColor,
        'text-outline-color': activeColor
      }
    },
    {
      selector: 'edge',
      style: {
        'width': 3,
        'curve-style': 'bezier',
        'line-color': defaultColor,
        'target-arrow-color': defaultColor,
        'source-arrow-color': defaultColor,
        'source-endpoint': 'inside-to-node',
        'target-endpoint': 'outside-to-node'
      }
    },
    {
      selector: 'node -> node[?isInteraction]',
      style: {
        'target-endpoint': 'inside-to-node'
      }
    },
    {
      selector: 'edge[type="positive"]',
      style: {
        'target-arrow-shape': 'triangle'
      }
    },
    {
      selector: 'edge[type="negative"]',
      style: {
        'target-arrow-shape': 'tee'
      }
    },
    {
      selector: 'edge:selected',
      style: {
        'line-color': activeColor,
        'target-arrow-color': activeColor,
        'z-index': 999,
        'z-compound-depth': 'top'
      }
    },
    {
			selector: '.eh-handle',
			style: {
        'label': '',
        'background-image': _.memoize( () => {
          let dataUri = svg => 'data:image/svg+xml;utf8,' + encodeURIComponent( svg );

          let svg = '<svg fill="#ffffff" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M0 0h24v24H0z" fill="none"/><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/></svg>';
          let svgCircle = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" stroke="#fff" stroke-width="3" fill="transparent"/></svg>';

          return [ dataUri(svg), dataUri(svgCircle) ];
        }, () => 'const-cache-key' ),
        'background-width': [ '80%', '100%' ],
        'background-height': [ '80%', '100%' ],
        'background-clip': 'node',
				'background-color': activeColor,
				'width': 12,
				'height': 12,
				'shape': 'ellipse',
				'overlay-opacity': 0,
				'border-width': 2, // makes the handle easier to hit
				'border-opacity': 0,

        // effectively remove the handle node for now
        'events': 'no',
        'opacity': 0
			}
		},
    {
      selector: '.eh-preview, .eh-ghost-edge',
      style: {
        'text-outline-color': activeColor,
        'background-color': activeColor,
        'line-color': activeColor,
        'target-arrow-color': activeColor,
        'source-arrow-color': activeColor,
        'source-endpoint': 'inside-to-node',
        'target-endpoint': 'inside-to-node'
      }
    },
    {
      selector: '.eh-ghost-edge',
      style: {
        'opacity': 0.5
      }
    },
    {
      selector: '.cxtmenu-tgt',
      style: {
        'overlay-opacity': 0
      }
    },
    {
      selector: '.eh-source, .eh-target',
      style: {
        'overlay-opacity': 0,
        'border-color': activeColor,
        'border-width': 4,
        'border-style': 'double'
      }
    }
  ].filter( block => block != null );
}

module.exports = makeStylesheet;
