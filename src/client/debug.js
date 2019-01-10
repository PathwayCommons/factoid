let domReady = require('fready');
let logger = require('./logger');

let debug = window.dbg = {
  enabled: function( on ){
    if( arguments.length === 0 ){
      if( this._enabled != null ){
        return this._enabled;
      } else {
        return window.DEBUG || process.env.NODE_ENV !== 'production';
      }
    } else {
      this._enabled = !!on;
    }
  },

  livereload: function(){
    let script = document.createElement('script');
    script.src = 'http://' + window.location.hostname + ':35729/livereload.js';

    document.head.prepend( script );
  },

  init: function(){
    domReady( () => this.livereload() );
  },

  logger: function(){
    return logger;
  }
};

module.exports = debug;
