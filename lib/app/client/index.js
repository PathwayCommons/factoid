// code to be executed only on the client side
module.exports = function(){
  // import client side libraries so that we can use them in the client code
  require('./lib');

  // import client side code
  require('./extendo');
  require('./cytoscape');
  require('./info');
  require('./cyutil');
};