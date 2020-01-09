import { jsonHash } from './obj';

const getStringifiedKey = function(){
  return jsonHash( Array.from(arguments) );
};

const memoize = ( fn, cache, getKey = getStringifiedKey ) => {
  let getVal = args => fn.apply( null, args );

  if( cache === undefined ){
    cache = new Map();
  }

  return function(){
    let args = arguments;
    let key = getKey( ...args );
    let val;

    if( cache.has(key) ){
      val = cache.get(key);
    } else {
      val = getVal( args );

      cache.set( key, val );
    }

    return val;
  };
};

export { memoize };
