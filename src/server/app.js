var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var app = express();
var io = require('socket.io')(app);

// view engine setup
app.set('views', path.join(__dirname, '../../', 'views'));
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

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
