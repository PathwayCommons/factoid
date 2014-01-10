// code to be executed only on the client side
module.exports = function(){
  // import client side libraries so that we can use them in the client code
  require('./lib');

  // import client side code
  require('./model-init');
  require('./touch-detect');
  require('./kill-emu-events');
  require('./services');
  require('./ui');
  require('./cytoscape');
  require('./extendo');
  require('./add-buttons');
  require('./cyutil');
  require('./qtip');
  require('./entities');
  require('./edit-entity');
  require('./shortcuts');
  require('./text-inputs');
  require('./organism-select');
  require('./help');
  require('./textmining');
  require('./on-load');
};