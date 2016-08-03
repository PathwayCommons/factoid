// an object to hold socket.io bindings without a ref to an actual socket.io instance (yet)

class Io {
  static router(){ return new Io(); }

  constructor(){}

  get bindings(){
    let bgs = this._bindings = this._bindings || [];

    return bgs;
  }

  on( type, handler ){
    this.bindings.push({
      type: type,
      handler: handler
    });

    return this;
  }

  of( ns ){
    this.namespace = ns;

    return this;
  }

  bind( io ){
    let nsIo;

    if( this.namespace ){
      nsIo = io.of( this.namespace );
    } else {
      nsIo = io;
    }

    this.bindings.forEach( b => nsIo.on( b.type, b.handler ) );

    return this;
  }

  use( io ){
    this.bind( io );

    return this;
  }
}

module.exports = Io;
