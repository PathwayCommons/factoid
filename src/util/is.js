let typeofObj = typeof {};
let typeofWin = typeof window;

function isClient(){
  return typeofWin === typeofObj;
}

function isServer(){
  return !isClient();
}

module.exports = { isClient, isServer };
