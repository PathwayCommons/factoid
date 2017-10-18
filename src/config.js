let process = require('process');
let _ = require('lodash');
let { isClient } = require('./util');

let defaults = {
  PORT: 3000,

  LOG_LEVEL: 'info',

  // Connect to localhost
  SOCKET_HOST: isClient() ? window.location.hostname : 'localhost',

  // Use localhost db with no auth by default (default rethink config).
  DB_NAME: 'factoid',
  DB_HOST: 'localhost',
  DB_PORT: 28015,
  REACH_URL: 'http://agathon.sista.arizona.edu:8080/odinweb/api/text',
  DB_USER: undefined, // username if db uses auth
  DB_PASS: undefined, // password if db uses auth
  DB_CERT: undefined  // path to a certificate (cert) file if db uses ssl
};

let envVars = _.pick( process.env, Object.keys( defaults ) );

let conf = Object.assign( {}, defaults, envVars );

Object.freeze( conf );

module.exports = conf;
