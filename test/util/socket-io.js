let serverIo;
let clientIo = require('socket.io-client');
let clientSockets = [];

let client = (function( ns ){
  let socket = clientIo('http://localhost:54321/' + ns, {
    // unused sockets shouldn't try to reconnect, potentially interfering with other tests
    reconnection: false
  });

  clientSockets.push( socket );

  return socket;
});

let server = (function( ns ){
  return serverIo.of('/' + ns);
});

let stop = function(){
  clientSockets.forEach( socket => socket.close() );

  clientSockets = [];

  serverIo.close();
};

let start = function(){
  serverIo = require('socket.io')(54321);

  return serverIo;
};

module.exports = { client, server, start, stop };
