let _ = require('lodash');
let Cytoscape = require('cytoscape');
let edgehandles = require('cytoscape-edgehandles');
let cxtmenu = require('cytoscape-cxtmenu');
let automove = require('cytoscape-automove');
let cose = require('cytoscape-cose-bilkent');
let cypopper = require('cytoscape-popper');

function regCyExts(){
  regCyLayouts();

  [ edgehandles, cxtmenu, automove, cypopper ].forEach( ext => Cytoscape.use( ext ) );
}

function regCyLayouts(){
  [ cose ].forEach( ext => Cytoscape.use( ext ) );
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
      isInteraction: docEl.isInteraction()
    }
  };

  if( docEl.isEntity() ){
    el.position = _.clone( docEl.position() );
    el.data.associated = docEl.associated();
    el.data.completed = docEl.completed();
  }

  if( docEl.isInteraction() ){
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

module.exports = { makeCyEles, regCyExts, regCyLayouts, getCyLayoutOpts, isInteractionNode };
