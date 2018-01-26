const { jsonHash } = require('./obj');
const getStringifiedKey = args => jsonHash( Array.from(args) );

const memoize = ( fn, cache, getKey = getStringifiedKey ) => {
  let getVal = args => fn.apply( null, args );

  return function(){
    let args = arguments;
    let key = getKey( args );
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

module.exports = { memoize };
