// this file is responsible for proxying calls from the local window.services
// object to the tmapi socket namespace and receiving the response back from
// the server

// TODO refactor all of this with some sort of js rpc library
// (both now.js and dnode are broken atm)
// /OR/ 
// at least refactor the code s.t. each fn is defined automatically

var tmapi = io.connect( window.location.origin + '/services' );

var lastMs = 0;
var lastInt = 0;
var maxInt = 2000000000;
var calls = {};

function callFn(name, args, next){
  if( !calls[name] ){
    calls[name] = [];

    // when getting a call back from the server, look up who should get it
    // since there may be multiple calls to the same function
    tmapi.on(name, function(){
      var id = arguments[0]; // the rpc call id

      var args = []; // args that could be sent to next()
      for( var i = 1; i < arguments.length; i++ ){
        args.push( arguments[i] );
      }
      
      // find the call with the same id, and trigger it
      for( var i = 0; i < calls[name].length; i++ ){
        var call = calls[name][i];

        var idMatches = call.id === id;

        if( idMatches ){ // then call the function
          calls[name].splice(i, 1); // remove from array since we don't need it anymore
          call.next.apply( call.next, args );
          break;
        }
      }
    });
  }

  var ms = +new Date;
  lastInt = (++lastInt % maxInt); // so ids don't collide on same ms
  var id = ms + '-' + lastInt;

  // store the call
  calls[name].push({
    id: id,
    next: next
  });


  // send the call to the server

  // adds [name, id] to front of arg list
  args.unshift( id );
  args.unshift( name );

  tmapi.emit.apply( tmapi, args );
}

// get the list of server side functions, passing no dep's, since 
// we don't need to actually call these functions (we just send
// socket messages)
var tmServerFns = (require('../../services'))(  );
window.services = {};

_.each(tmServerFns, function(fn, fnName){
  window.services[ fnName ] = function(){
    var args = [];
    for( var i = 0; i < arguments.length - 1; i++ ){
      args.push( arguments[i] );
    }
    var next = arguments[ arguments.length - 1 ];


    callFn(fnName, args, next);
  };
});

