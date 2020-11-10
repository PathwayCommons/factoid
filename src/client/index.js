import debug from './debug';
import Router from './router';
import ReactDom from 'react-dom';
import h from 'react-hyperscript';
import hh from 'hyperscript';
import { regCyExts } from '../util';
import { $ } from './dom';
import smoothscroll from 'smoothscroll-polyfill';
 
smoothscroll.polyfill(); // enable smooth scroll on safari

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
