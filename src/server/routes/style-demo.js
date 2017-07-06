var http = require('express').Router();

http.get('/', function(req, res) {
  res.render('style-demo');
});

module.exports = http;
