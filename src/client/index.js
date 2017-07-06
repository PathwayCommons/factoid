// polyfills
require('babel-polyfill');
require('whatwg-fetch');

let Promise = require('bluebird');

Promise.config({
  cancellation: true
});

let debug = require('./debug');
let Router = require('./router');
let ReactDom = require('react-dom');
let h = require('react-hyperscript');
let hh = require('hyperscript');
let { $ } = require('../util');

// register cytoscape extensions
require('./cytoscape-extensions')();

if( debug.enabled() ){
  debug.init();
}

let rootDiv = hh('div#root');
let body = document.body;
let hideInitter = () => {
  let el = $('.init-app');

  if( el ){
    el.classList.add('init-app-initted');
  }
};

body.appendChild( rootDiv );

ReactDom.render( h( Router ), rootDiv, hideInitter );
