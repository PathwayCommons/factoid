import express from 'express';
var http = express.Router();

// get the app ui
http.get('*', function(req, res) {
  res.render('index');
});

export default http;
