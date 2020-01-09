import ElementCache from './element-cache';

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

export default EmptyElementCache;
