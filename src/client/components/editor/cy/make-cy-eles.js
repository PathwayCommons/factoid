let _ = require('lodash');

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

  els.push({
    data: {
      id: docEl.id(),
      name: docEl.name(),
      type: docEl.type(),
      isEntity: docEl.isEntity(),
      isInteraction: docEl.isInteraction(),
      associated: docEl.isEntity() ? docEl.associated() : undefined
    },
    position: _.clone( docEl.position() )
  });

  if( docEl.isInteraction() ){ // add edges connecting participants to interaction node
    els.push( ...makePptEdges( docEl ) );
  }

  return els;
}

function makePptEdges( docIntn, docPpt ){
  let els = [];
  let ppts = docPpt ? [ docPpt ] : docIntn.participants();

  ppts.forEach( ppt => {
    els.push({
      data: { source: docIntn.id(), target: ppt.id() }
    });
  } );

  return els;
}

module.exports = { makeCyEles, makePptEdges };
