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

    let slice = ( arr, i, j ) => Array.prototype.slice.call( arr, i, j );

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

module.exports = { passthrough, promisify };
