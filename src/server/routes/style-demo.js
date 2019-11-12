import express from 'express';
var http = express.Router();

http.get('/', function(req, res) {
  res.render('style-demo.html');
});

export default http;
