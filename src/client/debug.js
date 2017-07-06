let domReady = require('fready');
let Promise = require('bluebird');
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

  debugPromises: function(){
    Promise.config({
      warnings: true,
      longStackTraces: true
    });
  },

  livereload: function(){
    let script = document.createElement('script');
    script.src = 'http://' + window.location.hostname + ':35729/livereload.js';

    document.head.insertBefore( script, document.head.firstChild );
  },

  init: function(){
    domReady( () => this.livereload() );

    this.debugPromises();
  },

  logger: function(){
    return logger;
  }
};

module.exports = debug;
