import express from 'express';
import path from 'path';
import favicon from 'serve-favicon';
import morgan from 'morgan';
import logger from './logger';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import http from 'http';
import stream from 'stream';
import fs from 'fs';
import { regCyLayouts, tryPromise } from '../util';
import RoutesApi from './routes/api';
import RoutesStyleDemo from './routes/style-demo';
import RoutesIndex from './routes/index';
import * as config from '../config';
import socketio from 'socket.io';
import db from './db';
import Syncher from '../model/syncher';
import cron from 'node-cron';
import updateCron from './update-cron';
import { Appsignal } from '@appsignal/nodejs';
import { expressMiddleware as asExpressMiddleware, expressErrorHandler as asExpressErrorHandler } from '@appsignal/express';
import { initExportTasks } from './routes/api/document/export';
import { setupGraphDbFeeds, refreshGraphDB } from './routes/api/document/graphdb';

let app = express();
let server = http.createServer(app);
let io = socketio(server);

const appsignal = new Appsignal({
  active: true,
  name: 'Biofactoid'
});

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

app.set('view engine', 'ejs');

app.use(favicon(path.join(__dirname, '../..', 'public', 'image', 'logo.png')));
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

app.use(asExpressMiddleware(appsignal)); // must be after all other use() but just before routes

app.use(express.static(path.join(__dirname, '../..', 'public')));

// define http routes

app.use( '/api', RoutesApi );

if( app.get('env') === 'development' ){
  app.use('/style-demo', RoutesStyleDemo);
}

app.use( '/', RoutesIndex );

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  let err = new Error('URL not found: ' + req.url);

  err.status = 404;

  next( err );
});

// general error handler
app.use(function(err, req, res) {
  let status = err.status || 500;

  logger.error('An error occurred serving a resource');
  logger.error('Status code: ' + (status || 'none'));
  logger.error( err );

  res.status( status );

  switch( status ){
    case 404:
      res.render('404', { EMAIL_ADDRESS_INFO: config.EMAIL_ADDRESS_INFO });
      break;
    default:
      res.render('error');
      break;
  }

});

app.use(asExpressErrorHandler(appsignal)); // must be after all other use()


let port = normalizePort(config.PORT);

app.set('port', port);

server.on('error', onError);
server.on('listening', onListening);

// setup the table and live synching for each model type
tryPromise( () => {
  let log = (...msg) => function( val ){ logger.debug( ...msg ); return val; };

  let access = name => db.accessTable( name );

  let secretExists = secret => {
    return (
      access('secret')
      .then( ({ table, conn }) => table.get(secret).run(conn) )
      .catch(() => {
        throw new Error(`The secret '${secret}' does not exist.  Ensure that an API_KEY-holding user has created the document, which will create the secret automatically.`);
      })
    );
  };

  let synch = (t, name) => Syncher.synch({
    rethink: t.rethink,
    table: t.table,
    conn: t.conn,
    io: io.of( '/' + name ),
    secretExists
  });

  let setup = name => {
    return access( name )
      .then( log('Accessed table "%s"', name) )
      .then( t => synch( t, name ) )
      .then( log('Set up synching for "%s"', name) )
      .then( () => db.guaranteeIndex( 'document', 'createdDate' ) )
      .then( () => db.guaranteeIndex( 'document', 'status' ) )
      .then( log('Set up index for document') )
      .then( setupGraphDbFeeds )
      .then( refreshGraphDB )
    ;
  };

  const tables = ['element', 'document'];
  return tables.reduce( ( p, name ) => p.then( () => setup( name ) ), Promise.resolve() );
} )
.then( () => {
  cron.schedule( config.CRON_SCHEDULE, () => {
    updateCron();
  });
} )
.then( () => {
  server.listen(port);
} )
.then( initExportTasks )
;

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

export default app;
