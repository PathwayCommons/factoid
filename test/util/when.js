let when = ( emitter, evt ) => new Promise( resolve => emitter.on(evt, resolve) );

let whenN = ( emitter, evt, n = 1 ) => new Promise( resolve => {
  let i = 0;

  emitter.on( evt, () => {
    i++;

    if( i === n ){
      resolve();
    } else if( i > n ){
      console.error(`Expected ${evt} event ${n}x but got ${i}x`);
    }
  } );
} );

let delay = duration => new Promise( resolve => setTimeout( resolve, duration ) );

let whenAllN = ( emitters, evt, n = 1 ) => Promise.all( emitters.map( s => whenN(s, evt, n) ) );

export {
  whenN as when,
  whenAllN as whenAll,
  delay
};
