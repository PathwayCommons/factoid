const getStringifiedKey = args => JSON.stringify( args );

const memoize = ( fn, cache, getKey = getStringifiedKey ) => {
  let getVal = args => fn.apply( null, args );

  return function(){
    let args = arguments;
    let key = getKey( args );

    if( cache.has(key) ){
      return cache.get(key);
    } else {
      let val = getVal( args );

      cache.set( key, val );

      return val;
    }
  };
};

module.exports = { memoize };
