let _ = require('lodash');

function firstDefined( value, defaultValue /* ... */ ){
  let arg;

  for( var i = 0; i < arguments.length; i++ ){
    arg = arguments[i];

    if( arg != null ){ return arg; }
  }
}

// fill({
//   obj:  { foo: 1 }
//   from: { foo: 2, bar: 2, caz: 2 },
//   defs: { foo: 3, bar: 3, baz: 3 }, // optional
//   only: [ 'foo', 'bar', 'baz' ]     // optional
// });
function fill( opts ){
  let tgt = opts.obj;
  let only;

  if( opts.only ){
    only = opts.only;
  } else if( opts.defs ){
    only = _.keys( opts.defs );
  }

  let src = _.assign( {}, opts.defs, opts.from );

  if( only ){
    src = _.pick( src, only );
  }

  _.assign( tgt, src );

  return tgt;
}

module.exports = { firstDefined, fill };
