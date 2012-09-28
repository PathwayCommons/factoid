// code to be executed only on the client side
module.exports = function(){
  // import client side libraries so that we can use them in the client code
  require('./lib');

  // import client side code
  require('./textmining');
  require('./ui');
  require('./extendo');
  require('./cytoscape');
  require('./add-buttons');
  require('./cyutil');
  require('./qtip');
  require('./popover');
  require('./entities');
  require('./shortcuts');
  require('./edit-entity-qtips');
  require('./text-inputs');
};