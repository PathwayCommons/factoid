var express = require('express');
var http = express.Router();
var io = require('./socket.io').router();

/* GET users listing. */
http.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

io.on('connection', function( socket ){
  socket.on('user-edit-name', function( data ){
    socket.emit();
  });
});

module.exports = { http, io };
