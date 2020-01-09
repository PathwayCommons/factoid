import { error } from './obj';
import CancelablePromise from 'p-cancelable';

const slice = ( arr, i, j ) => Array.prototype.slice.call( arr, i, j );

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

function defer() {
  var resolve, reject;
  var promise = new Promise(function() {
    resolve = arguments[0];
    reject = arguments[1];
  });
  return {
    resolve: resolve,
    reject: reject,
    promise: promise
  };
}

function tryPromise( fn ){
  return Promise.resolve().then(fn);
}

function makeCancelable( p ){
  return new CancelablePromise( (resolve, reject) => {
    p.then(resolve).catch(reject);
  } );
}

export { passthrough, promisifyEmit, promiseOn, delay, delayPassthrough, defer, tryPromise, makeCancelable };
