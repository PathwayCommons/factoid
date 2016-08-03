module.exports = function( fn ){
  switch( document.readyState ){
    case 'complete':
    case 'interactive':
      setTimeout( fn, 0 );
      break;
    default:
      window.addEventListener( 'DOMContentLoaded', fn );
  }
};
