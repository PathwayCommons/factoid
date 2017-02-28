let domReady = require('fready');
let livereload = require('./livereload');

let debug = {
  enabled: !!window.DEBUG,

  init: function(){
    domReady( livereload );
  }
};

module.exports = debug;
