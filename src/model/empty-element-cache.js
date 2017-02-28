let ElementCache = require('./element-cache');

class EmptyElementCache extends ElementCache {
  constructor( opts ){
    super( opts );
  }

  has(){
    return false;
  }

  get(){
    return undefined;
  }

  add(){}

  remove(){}
}

module.exports = EmptyElementCache;
