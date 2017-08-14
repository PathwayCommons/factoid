let typeofObj = typeof {};
let typeofWin = typeof window;

function isClient(){
  return typeofWin === typeofObj;
}

function isServer(){
  return !isClient();
}

function isInteractionNode( el ){
  return el.data('isInteraction') === true;
}

module.exports = { isClient, isServer, isInteractionNode };
