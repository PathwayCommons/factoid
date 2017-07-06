let serverIo;
let clientIo = require('socket.io-client');

let client = (function( ns ){
  return clientIo.connect('http://localhost:54321/' + ns);
});

let server = (function( ns ){
  return serverIo.of('/' + ns);
});

let stop = function(){
  serverIo.close();
};

let start = function(){
  serverIo = require('socket.io')(54321);

  return serverIo;
};

module.exports = { client, server, start, stop };
