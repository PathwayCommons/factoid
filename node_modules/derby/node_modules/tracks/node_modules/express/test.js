
var express = require('./');
var app = express();

// app.get('/stuff*', function(req, res){
//   res.send(req.params[0] || 'nothing');
// });

app.get('/stuff+', function(req, res){
  res.send(req.params[0] || 'nothing');
});

app.listen(3000);
