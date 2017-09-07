let express = require('express');
let path = require('path');
let favicon = require('serve-favicon');
let morgan = require('morgan');
let logger = require('./logger');
let cookieParser = require('cookie-parser');
let bodyParser = require('body-parser');
let http = require('http');
let Promise = require('bluebird');
let stream = require('stream');
let fs = require('fs');
let { regCyLayouts } = require('../util');

let config = require('../config');
let app = express();
let server = http.createServer(app);
let io = require('socket.io')(server);

let db = require('./db');
let Syncher = require('../model/syncher');

// make sure cytoscape layouts are registered for server-side use
regCyLayouts();

// view engine setup
app.set('views', path.join(__dirname, '../', 'views'));

// define an inexpensive html engine that doesn't do serverside templating
app.engine('html', function (filePath, options, callback){
  fs.readFile(filePath, function (err, content) {
    if( err ){ return callback( err ); }

    return callback( null, content.toString() );
  });
});

app.set('view engine', 'html');

app.use(favicon(path.join(__dirname, '../..', 'public', 'icon.png')));
app.use(morgan('dev', {
  stream: new stream.Writable({
    write( chunk, encoding, next ){
      logger.info( chunk.toString('utf8').trim() );

      next();
    }
  })
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '../..', 'public')));

// define http routes

app.use( '/api', require('./routes/api') );

if( app.get('env') === 'development' ){
  app.use('/style-demo', require('./routes/style-demo'));
}

app.use( '/', require('./routes/index') );

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  let err = new Error('URL not found: ' + req.url);

  err.status = 404;

  next( err );
});

// general error handler
app.use(function(err, req, res, next) {
  let status = err.status || 500;

  logger.error('An error occurred serving a resource');
  logger.error('Status code: ' + (status || 'none'));
  logger.error( err );

  res.status( status );

  switch( status ){
    case 404:
      res.render('404');
      break;
    default:
      res.render('error');
      break;
  }

  next( err );
});


let port = normalizePort(config.PORT);

app.set('port', port);

server.on('error', onError);
server.on('listening', onListening);

// setup the table and live synching for each model type
Promise.try( () => {
  let log = (...msg) => function( val ){ logger.debug( ...msg ); return val; };
  let access = name => db.accessTable( name );
  let synch = (t, name) => Syncher.synch({ rethink: t.rethink, table: t.table, conn: t.conn, io: io.of( '/' + name ) });
  let setup = name => {
    return access( name )
      .then( log('Accessed table "%s"', name) )
      .then( t => synch( t, name ) )
      .then( log('Set up synching for "%s"', name) )
    ;
  };

  return Promise.all( ['element', 'document'].map( setup ) );
} ).then( () => {
  server.listen(port);
} );

function normalizePort(val) {
  let port = parseInt(val, 10);

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

  let bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      logger.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      logger.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

function onListening() {
  let addr = server.address();
  let bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  logger.debug('Listening on ' + bind);
}

module.exports = app;
