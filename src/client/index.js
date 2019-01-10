let debug = require('./debug');
let Router = require('./router');
let ReactDom = require('react-dom');
let h = require('react-hyperscript');
let hh = require('hyperscript');
let { $, regCyExts } = require('../util');

// make sure cytoscape extensions are registered for the client side
regCyExts();

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
