let ElementCache = require('../../src/model/element-cache');
let _ = require('lodash');

let factoryErr = function(){
  throw new Error('Missing factory for cache');
};

let sourceErr = function(){
  throw new Error('Missing source for cache');
};

let sourceNop = function(){
  console.warn('Using nop source for mock cache');
};

class MockCache extends ElementCache {
  constructor( opts = {} ){
    super( _.assign( {
      secret: 'secret', // used in almost all tests
      factory: { // needs to be specified manually
        make: factoryErr,
        load: factoryErr
      }
    }, opts ) );

    this.source = {
      elements: new Map(),
      has: function( id ){
        return this.elements.has( id );
      },
      get: function( id ){
        return this.elements.get( id );
      },
      add: function( ele ){
        this.elements.set( ele.id(), ele );

        return Promise.resolve('MockCache source.add() promise');
      },
      remove: function( ele ){
        this.elements.delete( _.isString( ele ) ? ele : ele.id() );

        return Promise.resolve('MockCache source.remove() promise');
      }
    };
  }

  has( id ){ return this.source.has(id); }

  get( id ){ return this.source.get(id); }

  add( ele ){ return this.source.add(ele); }

  remove( ele ){ return this.source.remove(ele); }
}

module.exports = MockCache;
