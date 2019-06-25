import _ from 'lodash';
import Cytoscape from 'cytoscape';
import edgehandles from 'cytoscape-edgehandles';
import cxtmenu from 'cytoscape-cxtmenu';
import automove from 'cytoscape-automove';
import cose from 'cytoscape-cose-bilkent';
import cypopper from 'cytoscape-popper';
import compoundDnd from 'cytoscape-compound-drag-and-drop';

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

export { makeCyEles, regCyExts, regCyLayouts, getCyLayoutOpts, isInteractionNode, cyUpdateParent };
