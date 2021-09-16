import _ from 'lodash';
import Cytoscape from 'cytoscape';
import edgehandles from 'cytoscape-edgehandles';
import cxtmenu from 'cytoscape-cxtmenu';
import automove from 'cytoscape-automove';
import cose from 'cytoscape-cose-bilkent';
import cypopper from 'cytoscape-popper';
import compoundDnd from 'cytoscape-compound-drag-and-drop';
import { isComplex } from '../model/element/element-type';

export const defaultColor = '#666';
export const activeColor = '#0169d9';
export const labelColor = '#fff';
export const nodeSize = 30;

function regCyExts(){
  regCyLayouts();

  [ edgehandles, cxtmenu, automove, cypopper, compoundDnd ].forEach( ext => Cytoscape.use( ext ) );
}

function regCyLayouts(){
  [ cose ].forEach( ext => Cytoscape.use( ext ) );
}

function cyUpdateParent( cy, docEl, newParentId, oldParentId ) {
  let getCyEl = docEl => cy.getElementById( docEl.id() );

  if ( newParentId == oldParentId ) {
    return;
  }

  let cyEl = getCyEl( docEl );
  let parent = newParentId ? newParentId : null;
  cyEl.move( { parent } );
}

function makeCyEles( docEls ){
  if( !Array.isArray( docEls ) ){
    return makeCyElesForEle( docEls );
  }

  return docEls.reduce( ( els, docEl ) => {
    els.push( ...makeCyElesForEle( docEl ) );

    return els;
  }, [] );
}

function makeCyElesForEle( docEl ){
  let els = [];

  let el = {
    data: {
      id: docEl.id(),
      name: docEl.name(),
      type: docEl.type(),
      isEntity: docEl.isEntity(),
      isInteraction: docEl.isInteraction(),
      isComplex: docEl.isComplex()
    }
  };

  el.data.parent = ( docEl.isEntity() && docEl.getParentId() ) || null;

  if( docEl.isEntity() ){
    el.position = _.clone( docEl.position() );
    el.data.associated = docEl.associated();
    el.data.completed = docEl.completed();
  }
  else if( docEl.isInteraction() ){
    let ppts = docEl.participants();
    let assoc = docEl.association();
    let src = assoc.getSource();
    let tgt = assoc.getTarget();

    if( !src || !tgt ){
      src = ppts[0];
      tgt = ppts[1];
    }

    el.data.source = src.id();
    el.data.target = tgt.id();
    el.data.sign = assoc.getSign().value;
  }

  els.push( el );

  return els;
}

function getCyLayoutOpts(){
  return {
    name: 'cose-bilkent',
    animateFilter: node => !isInteractionNode( node ),
    randomize: false
  };
}

function isInteractionNode( el ){
  return el.data('isInteraction') === true;
}

function makeBaseStylesheet(isStatic = false){
  return [
    {
      selector: 'node',
      style: {
        'background-color': defaultColor,
        'width': nodeSize,
        'height': nodeSize,
        'label': isStatic ? 'data(name)' : function( node ){
          let name = node.data('name');
          let completed = node.data('completed');
          let type = node.data('type');

          if( !completed && !isComplex(type) ){
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
        'background-color': '#FFFFFF',
        'text-outline-opacity': 0,
        'color': defaultColor,
        'text-valign': 'top'
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
        'target-endpoint': 'outside-to-node-or-label',
        'source-endpoint': 'outside-to-node-or-label'
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
        'target-arrow-shape': 'tee',
        'target-distance-from-node': 1
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
  ];
}

function makeStaticStylesheet(){
  return makeBaseStylesheet(true);
}

function makeStylesheet(){
  return [
    ...makeBaseStylesheet(false),
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
    },
    {
      selector: 'node.invisible-el',
      style: {
        'border-opacity': 0,
        'background-opacity': 0,
        'background-image-opacity': 0,
        'text-opacity': 0
      }
    }
  ].filter( block => block != null );
}

export { makeCyEles, regCyExts, regCyLayouts, getCyLayoutOpts, isInteractionNode, cyUpdateParent, makeStylesheet, makeStaticStylesheet };
