let _ = require('lodash');
let serverIo = require('socket.io')(54321);
let clientIo = require('socket.io-client');

let client = (function( ns ){
  return clientIo.connect('http://localhost:54321/' + ns);
});

let server = (function( ns ){
  return serverIo.of('/' + ns);
});

module.exports = { client, server };
