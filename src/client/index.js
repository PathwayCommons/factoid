require('babel-polyfill');

let debug = require('./debug');

if( debug.enabled ){
  debug.init();
}

// TODO client
