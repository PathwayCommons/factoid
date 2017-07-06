var express = require('express');
var http = express.Router();

// get the app ui
http.get('*', function(req, res) {
  res.render('index');
});

module.exports = http;
