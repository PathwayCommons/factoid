var http = require('http')
  , path = require('path')
  , express = require('express')
  , gzippo = require('gzippo')
  , derby = require('derby')
  , app = require('../app')
  , serverError = require('./serverError')
  , defineServerSideRoutes = require('./server-side-routes')


// SERVER CONFIGURATION //

var expressApp = express()
  , server = module.exports = http.createServer(expressApp)

var io = require('socket.io').listen(server)
io.set('log level', 0); // https://github.com/LearnBoost/Socket.IO/wiki/Configuring-Socket.IO

derby.use(derby.logPlugin)
var store = derby.createStore({ // namespace derby socket.io so it doesn't clash with the services we define
  sockets: io.of('/derby'),
  socketUri: '/derby'
})

var ONE_YEAR = 1000 * 60 * 60 * 24 * 365
  , root = path.dirname(path.dirname(__dirname))
  , publicPath = path.join(root, 'public')

expressApp
  .use(express.favicon())
  // Gzip static files and serve from memory
  .use(gzippo.staticGzip(publicPath, {maxAge: ONE_YEAR}))
  // Gzip dynamically rendered content
  .use(express.compress())

  // Uncomment to add form data parsing support
  // .use(express.bodyParser())
  // .use(express.methodOverride())

  // Uncomment and supply secret to add Derby session handling
  // Derby session middleware creates req.model and subscribes to _session
  // .use(express.cookieParser())
  // .use(store.sessionMiddleware({
  //   secret: process.env.SESSION_SECRET || 'YOUR SECRET HERE'
  // , cookie: {maxAge: ONE_YEAR}
  // }))

  // Adds req.getModel method
  .use(store.modelMiddleware())
  // Creates an express middleware from the app's routes
  .use(app.router())
  .use(expressApp.router)
  .use(serverError(root))


// SERVER ONLY ROUTES //

defineServerSideRoutes( expressApp, io ) // include server-side-only routes

expressApp.all('*', function(req) {
  throw '404: ' + req.url
})

