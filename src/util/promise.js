var { error } = require('./obj');

let slice = ( arr, i, j ) => Array.prototype.slice.call( arr, i, j );

function passthrough( fn ){
  return function( val ){
    fn( val ); // also pass just in case you want to use the val

    return val;
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

function delay( duration ){
  return new Promise( resolve => setTimeout( () => resolve(), duration ) );
}

function delayPassthrough( duration ){
  return function( val ){
    return delay( duration ).then( () => val );
  };
}

module.exports = { passthrough, promisifyEmit, promiseOn, delay, delayPassthrough };
