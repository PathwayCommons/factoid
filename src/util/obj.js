let _ = require('lodash');
let sha512 = require('hash.js/lib/hash/sha/512');

function firstDefined( value, defaultValue /* ... */ ){ // eslint-disable-line no-unused-vars
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

function error( err ){
  if( _.isString( err ) ){
    return new Error( err );
  } else if( err instanceof Error ){
    return err;
  } else if( _.isObject( err ) ){
    let obj = err;

    err = new Error();

    _.assign( err, obj );

    return err;
  } else {
    return new Error();
  }
}

function getId( idOrObj ){
  let id;

  if( _.isString( idOrObj ) || _.isNumber( idOrObj ) ){
    id = idOrObj;
  } else if( _.isObject( idOrObj ) ) {
    let obj = idOrObj;

    if( _.isFunction( obj.id ) ){
      id = obj.id();
    } else {
      id = obj.id;
    }
  }

  return id;
}

function ensureArray( valOrArr ){
  if( _.isArray( valOrArr ) ){
    return valOrArr;
  } else if( valOrArr == null ){
    return [];
  } else {
    return [ valOrArr ];
  }
}

function lazySlice( arr, i, j ){
  if( i === 0 && j === arr.length ){
    return arr;
  } else {
    return arr.slice( i, j );
  }
}

function mixin( proto, obj, opts = {} ){
  let sanitized = _.omit( obj, ['constructor'].concat( opts.not ) );

  _.extend( proto, sanitized );
}

/** jsum
 * Stringifies a JSON object (not any randon JS object).
 *
 * It should be noted that JS objects can have members of
 * specific type (e.g. function), that are not supported
 * by JSON.
 *
 * @param {Object} obj JSON object
 * @returns {String} stringified JSON object.
 */
function serialize( obj, filter = () => true ){
  if( Array.isArray(obj) ){
    return JSON.stringify( obj.map( i => serialize(i) ) );
  } else if( typeof obj === 'object' && obj !== null ){
    return ( Object.keys(obj)
      .filter( filter )
      .sort()
      .map(k => `${k}:${serialize(obj[k])}`)
      .join('|')
    );
  }

  return obj;
}

function jsonHash( obj, filter ){
  let serializedJson = serialize( obj, filter );

  return sha512().update( serializedJson ).digest('hex');
}

function isNonNil(v){
  return !_.isNil(v);
}

module.exports = { firstDefined, fill, error, getId, ensureArray, lazySlice, mixin, jsonHash, isNonNil };
