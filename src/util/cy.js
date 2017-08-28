let _ = require('lodash');
let Cytoscape = require('cytoscape');
let edgehandles = require('cytoscape-edgehandles');
let cxtmenu = require('cytoscape-cxtmenu');
let qtip = require('cytoscape-qtip');
let automove = require('cytoscape-automove');
let cose = require('cytoscape-cose-bilkent');

function regCyExts(){
  regCyLayouts();

  [ edgehandles, cxtmenu, qtip, automove ].forEach( ext => Cytoscape.use( ext ) );
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
      modification: docEl.isEntity() ? docEl.modification().value : null,
      type: docEl.type(),
      isEntity: docEl.isEntity(),
      isInteraction: docEl.isInteraction(),
      associated: docEl.isEntity() ? docEl.associated() : undefined
    },
    position: _.clone( docEl.position() )
  };

  els.push( el );

  if( docEl.isInteraction() ){ // add edges connecting participants to interaction node
    let edges = makePptEdges( docEl );

    els.push( ...edges );
  }

  return els;
}

function makePptEdges( docIntn, docPpt ){
  let els = [];
  let ppts = docPpt ? [ docPpt ] : docIntn.participants();

  ppts.forEach( ppt => {
    els.push({
      data: { source: docIntn.id(), target: ppt.id(), type: docIntn.participantType( ppt ).value }
    });
  } );

  return els;
}

function getCyLayoutOpts(){
  return {
    name: 'cose-bilkent',
    randomize: false
  };
}

module.exports = { makeCyEles, makePptEdges, regCyExts, regCyLayouts, getCyLayoutOpts };
