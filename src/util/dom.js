function $( selector ){
  return document.querySelector( selector );
}

function $$( selector ){
  return Array.from( document.querySelectorAll( selector ) );
}

function makeClassList( obj ){
  let getClass = k => obj[k] ? k : null;
  let nonNil = v => v != null;
    
  return Object.keys( obj ).map( getClass ).filter( nonNil ).join(' ');
}

module.exports = { $, $$, makeClassList };
