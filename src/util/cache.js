const initCache = ( cache, key, initVal ) => {
  let cacheEntry = cache.get( key );

  if( cacheEntry == null ){
    cacheEntry = initVal;

    cache.set( key, cacheEntry );
  }

  return cacheEntry;
};

class SingleValueCache {
  constructor(){ this.value = null; }
  get(){ return this.value; }
  set(k, v){ this.value = v; }
}

export { initCache, SingleValueCache };
