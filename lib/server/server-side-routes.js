var http = require('http')
  , textmining = require('./textmining')
  , url = require('url')
  , log = console.log
;

module.exports = function( expressApp, io ){
  var app = expressApp;

  // TODO remove this when the textmining from cnio is revised
  app.get('/cnioproxy', function(req, res, next){

    var query = url.parse(req.url, true).query;
    var text = 'text=' + query.text;

    var preq = http.request({
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        'content-length': text.length
      },
      host: 'factoid.bioinfo.cnio.es',
      port: 80,
      path: '/TextMining/gene_mention_recognition?_format=json',
      method: 'POST'
    }, function(pres) {
      pres.setEncoding('utf8');
      pres.on('data', function (chunk) {
        var entityMap = JSON.parse( chunk );
        var entities = [];

        for( var i in entityMap ){
          var entity = entityMap[i];
          entities.push( entity );
        }

        res.send( entities );
      });
    });

    preq.on('error', function(e) {
      //console.log('problem with request: ' + e.message);
    });

    // write data to request body
    preq.write(text);
    preq.end();

  });

  // these listeners receive events from the client when the client code calls
  // functions in window.textmining
  //
  // the actual textmining functions are then called (on the server side) and
  // the result is emitted back to the client side
  //
  // rationale: it's faster and a much nicer api if the client code can call
  // the functions as if they were being called directly

  var tmFns = [];
  for( var fnName in textmining ){
    var fn = textmining[ fnName ];

    var isFunction = typeof fn === typeof function(){};
    if( !isFunction ){ continue; } // only handle functions

    tmFns.push({
      fn: fn,
      name: fnName
    });
  }

  var api = io
    .of('/tmapi')
    .on('connection', function(socket){
    
      // define all the tmapi (textmining api) socket functions here

      for( var j = 0; j < tmFns.length; j++ ){
        var fnStruct = tmFns[j];
        var fn = fnStruct.fn;
        var fnName = fnStruct.name;

        (function(fn, fnName){ // scope these var's, since we need them in the callback

          socket.on(fnName, function(callId, arg0, arg1, arg2, arg3, arg4, arg5 /* , ... */){
            var args = [];
            for( var i = 1; i < arguments.length; i++ ){
              args.push( arguments[i] );
            }

            // the last arg is the callback
            var callback = function(err, fnArg1, fnArg2, fnArg3, fnArg4, fnArg5){

              // NB passing args this way limits us to 5 in addition to err, but we shouldn't use more than that, anyway
              socket.emit(fnName, callId, err, fnArg1, fnArg2, fnArg3, fnArg4, fnArg5);
            };
            args.push( callback );

            // run the textmining function with the arguments
            fn.apply(textmining, args);
          });

        })(fn, fnName);

      }

    })
  ;

};