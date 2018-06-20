const h = require('react-hyperscript');

const Formula = ({ formula }) => {
  let split = formula.match(/(\d+|[n]|[A-Z][a-z]?)/g);
  let children = [];

  split.forEach( str => {
    if( str === 'n' || isNaN( parseInt(str) ) ){
      children.push( h('span', str) );
    } else {
      children.push( h('sub', str) );
    }
  } );

  return h('span.entity-info-formula', children);
};

module.exports = Formula;
