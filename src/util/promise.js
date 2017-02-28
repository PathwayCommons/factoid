var { error } = require('./obj');

let slice = ( arr, i, j ) => Array.prototype.slice.call( arr, i, j );

function passthrough( fn ){
  return function( val ){
    fn( val ); // also pass just in case you want to use the val

    return val;
  }
}

// reimpl of Bluebird.promisify()
function promisify( fn, options ){
  return function(){
    let options = Object.assign( {
      context: this,
      multiArgs: false
    }, options );

    let args = slice( arguments );

    return new Promise(( resolve, reject ) => {
      let callback = ( err, val ) => {
        if( err != null ){
          reject( err );
        } else {
          resolve( options.multiArgs ? slice( arguments, 1 ) : val );
        }
      };

      args.push( callback );

      fn.apply( options.context, args );
    });
  };
}

function promisifyEmit( emitter ){
  return (function(){
    let args = slice( arguments );

    return new Promise( ( resolve, reject ) => {
      args.push( ( err, val ) => {
        if( err ){
          reject( error(err) );
        } else {
          resolve( val );
        }
      } );

      emitter.emit.apply( emitter, args );
    } );
  });
}

function promiseOn( emitter, evt ){
  return new Promise( resolve => emitter.once( evt, resolve ) );
}

module.exports = { passthrough, promisify, promisifyEmit, promiseOn };
