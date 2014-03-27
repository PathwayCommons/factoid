var http = require('http')
  , fs = require('fs')
  , path = require('path')
  , express = require('express')
  , gzippo = require('gzippo')
  , derby = require('derby')
  , racerBrowserChannel = require('racer-browserchannel')
  , liveDbMongo = require('livedb-mongo')
  , app = require('../app')
  , serverError = require('./serverError')
  , defineServerSideRoutes = require('./server-side-routes')
  , config = require('../../config')
  , srvmon = require('./service-mon')
;


// SERVER CONFIGURATION //

var redis = require('redis').createClient();
// uncomment to select a different db index (http://redis.io/commands/SELECT)
// redis.select(1); // 1 is default

var expressApp = express()
  , server = module.exports = http.createServer(expressApp)

var io = require('socket.io').listen(server)
io.set('log level', 0); // https://github.com/LearnBoost/Socket.IO/wiki/Configuring-Socket.IO

// The store creates models and syncs data
var mongoUrl = config.mongoUrl; // 'mongodb://localhost:27017/factoid';
var store = derby.createStore({ // namespace derby socket.io so it doesn't clash with the services we define
  db: liveDbMongo(mongoUrl + '?auto_reconnect', { safe: true }),
  redis: redis
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
  
  // Add browserchannel client-side scripts to model bundles created by store,
  // and return middleware for responding to remote client messages
  .use(racerBrowserChannel(store))

  // Respond to requests for application script bundles
  .use(app.scripts(store))

  // Adds req.getModel method
  .use(store.modelMiddleware())

  // Creates an express middleware from the app's routes
  .use(app.router())
  .use(expressApp.router)
  .use(serverError(root))

  .use(express.logger({
    format: ':port :remote-addr - - [:date] ":method :url HTTP/:http-version" :status :res[content-length] ":user-agent" - :response-time ms',
    stream: fs.createWriteStream('reqlog.txt', {flags:'a', encoding:'utf8', mode:0666})
  }))


// monitor external services that we rely on
srvmon.start( config.serviceMonitorInterval );

// DEFINE STATIC RESOURCES IN THE MODEL //

var model = store.createModel();

model.subscribe('organisms', function(){

  model.setEach('organisms', {
    'ncbi9606': { // ids must be not be numeric
      id: 'ncbi9606',
      ncbiId: 9606,
      name: 'human',
      sciName: 'Homo sapiens',
    },

    'ncbi10090': {
      id: 'ncbi10090',
      ncbiId: 10090,
      name: 'mouse',
      sciName: 'Mus musculus'
    }
  });

});

// SERVER ONLY ROUTES //

defineServerSideRoutes( expressApp, io ) // include server-side-only routes

expressApp.all('*', function(req) {
  throw '404: ' + req.url
})

console.log( 'Factoid server started on ' + new Date().toString() );
