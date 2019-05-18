import { activeColor, defaultColor, labelColor, nodeSize } from './defs';
import _ from 'lodash';

function makeStylesheet(){
  return [
    {
      selector: 'node',
      style: {
        'background-color': defaultColor,
        'width': nodeSize,
        'height': nodeSize,
        'label': function( node ){
          let name = node.data('name');
          let completed = node.data('completed');

          if( !completed ){
            return '';
          } else {
            return name;
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
      selector: 'node:parent',
      style: {
        'background-opacity': 0.5,
        'background-color': '#FFFFFF'
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
        'source-arrow-color': defaultColor
      }
    },
    {
      selector: 'edge[sign="positive"]',
      style: {
        'source-arrow-shape': 'none',
        'target-arrow-shape': 'triangle'
      }
    },
    {
      selector: 'edge[sign="negative"]',
      style: {
        'source-arrow-shape': 'none',
        'target-arrow-shape': 'tee'
      }
    },
    {
      selector: 'edge[sign="positive"][?reversed]',
      style: {
        'source-arrow-shape': 'triangle',
        'target-arrow-shape': 'none'
      }
    },
    {
      selector: 'edge[sign="negative"][?reversed]',
      style: {
        'source-arrow-shape': 'tee',
        'target-arrow-shape': 'none'
      }
    },
    {
      selector: 'edge:selected',
      style: {
        'line-color': activeColor,
        'target-arrow-color': activeColor,
        'source-arrow-color': activeColor,
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
        'source-arrow-color': activeColor
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
    },
    {
      selector: '.eh-ghost-edge.eh-preview-active',
      style: {
        'opacity': 0
      }
    }
  ].filter( block => block != null );
}

export default makeStylesheet;
