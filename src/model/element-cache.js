let { fill, assertFieldsDefined, getId, tryPromise } = require('../util');

let defaults = {
  secret: 'read-only',
  factory: undefined // to get elements not in the cache
};

/**
A cache for biological elements.

If an element does not exist in the cache when queried, it will be loaded via the
specified source and added to the cache.

The cache prevents having to make queries to the server/DB for elements that are
already loaded (e.g. in the same document).  It also prevents double loading for
interactions.
*/
class ElementCache {
  constructor( opts = {} ){
    assertFieldsDefined( opts, ['factory'] );

    fill({
      obj: this,
      from: opts,
      defs: defaults
    });

    this.source = new Map();
  }

  has( id ){
    return this.source.has( id );
  }

  get( id ){
    return this.source.get( id );
  }

  add( ele ){
    this.source.set( ele.id(), ele );
  }

  remove( ele ){
    this.source.delete( getId( ele ) );
  }

  reload( ele ){
    let id = getId( ele );

    this.remove( ele );

    return this.load( id );
  }

  load( id, opts ){
    let secret = this.secret;
    let get = () => this.get( id );
    let load = () => this.factory.load({ cache: this, data: { id, secret } });
    let add = ele => this.add( ele, opts );
    let loadAndAddIfNoEle = ele => {
      if( ele ){ return ele; }

      return load().then( loadedEle => {
        add( loadedEle );

        return loadedEle;
      } );
    };

    return tryPromise( get ).then( loadAndAddIfNoEle );
  }
}

module.exports = ElementCache;
