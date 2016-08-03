var express = require('express');
var http = express.Router();
var io = require('./socket.io').router();
var path = require('path');

/* GET home page. */
http.get('/', function(req, res, next) {
  res.render('index.ejs', {
    development: req.app.get('env') === 'development'
  });
});

module.exports = { http, io };
