function $( selector ){
  return document.querySelector( selector );
}

function $$( selector ){
  return Array.from( document.querySelectorAll( selector ) );
}

module.exports = { $, $$ };
