var express = require('express');

var expressSession = require('express-session');
var serveStatic = require('serve-static');
var favicon = require('serve-favicon');
var compression = require('compression');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var highway = require('racer-highway');
var derbyLogin = require('derby-login');
var path = require('path');

module.exports = function (store, apps, error, publicDir, cb){

  var connectStore = require('connect-mongo')(expressSession);
  var sessionStore = new connectStore({url: process.env.MONGO_URL});

  var session = expressSession({
    secret: process.env.SESSION_SECRET,
    store: sessionStore,
    cookie: process.env.SESSION_COOKIE,
    saveUninitialized: true,
    resave: true
  });

  var handlers = highway(store, {session: session});

  var expressApp = express()
    .use(favicon( path.resolve(publicDir, 'img/favicon.ico') ))
    .use(compression())
    .use(serveStatic(publicDir))
    .use(store.modelMiddleware())
    .use(cookieParser())
    .use(bodyParser.json())
    .use(bodyParser.urlencoded({extended: true}))
    .use(session)
    .use(derbyLogin.middleware(store, require('../config/login')))
    .use(handlers.middleware)

  apps.forEach(function(app){
    expressApp.use(app.router());
  });

  expressApp.use(require('./routes'));

  expressApp
    .all('*', function (req, res, next) { next('404: ' + req.url); })
    .use(error);

  cb(expressApp, handlers.upgrade);
}
