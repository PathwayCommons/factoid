let _ = require('lodash');

let defaults = {

};

class Socket {
  constructor( opts ){
    opts = Object.assign( {}, defaults, opts );

    this.syncher = opts.syncher;
  }

  on(){
    return this;
  }

  emit( type /* data..., onServer */ ){
    let onServer = arguments[ arguments.length - 1 ];

    if( !_.isFunction( onServer ) ){
      onServer = _.noop;
    }

    if( type === 'load' ){
      let err = null;

      onServer( err, _.omit( this.syncher.get(), this.syncher.privateFields() ) );
    } else {
      onServer();
    }

    return this;
  }

}

module.exports = Socket;
