var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var debug = require('debug')('factoid:server');
var http = require('http');
var config = require('../config');
var path = require('path');

var app = express();
var server = http.createServer(app);
var io = require('socket.io')(server);

// view engine setup
app.set('views', path.join(__dirname, '../', 'views'));
app.set('view engine', 'jade');

app.use(favicon(path.join(__dirname, '../..', 'public', 'icon.png')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '../..', 'public')));

var ioUse = ( dir, routeIo ) => {
  if( routeIo == null ){
    routeIo = dir;
    dir = undefined;
  }

  if( dir === '/' ){
    dir = undefined;
  }

  routeIo.of( dir ).use( io );
};

var useRoutes = ( dir, routes ) => {
  app.use( dir, routes.http );
  ioUse( dir, routes.io );
};

useRoutes( '/', require('./routes/index') );

useRoutes( '/users', require('./routes/users') );

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error.ejs', {
      message: err.message,
      error: err,
      development: true
    });
  });
}

// production error handler
// no stacktraces leaked to user
// error page handler
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error.ejs', {
    message: err.message,
    error: {}
  });
});


var port = normalizePort(config.PORT);

app.set('port', port);

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  debug('Listening on ' + bind);
}

module.exports = app;
