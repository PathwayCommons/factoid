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

function focusDomElement( el ){
  el.focus();

  if( typeof el.value === typeof '' ){
    let len = el.value.length;

    el.setSelectionRange( len, len );
  }
}

export { $, $$, makeClassList, focusDomElement };
