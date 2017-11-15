let process = require('process');
let _ = require('lodash');
let { isClient } = require('./util');

const DEFAULT_CACHE_SIZE = process.env.DEFAULT_CACHE_SIZE || 100000;

let defaults = {
  PORT: 3000,

  LOG_LEVEL: 'info',

  // Connect to localhost
  SOCKET_HOST: isClient() ? window.location.hostname : 'localhost',

  // Use localhost db with no auth by default (default rethink config).
  DB_NAME: 'factoid',
  DB_HOST: 'localhost',
  DB_PORT: 28015,
  DB_USER: undefined, // username if db uses auth
  DB_PASS: undefined, // password if db uses auth
  DB_CERT: undefined,  // path to a certificate (cert) file if db uses ssl

  // Services
  REACH_URL: 'http://agathon.sista.arizona.edu:8080/odinweb/api/text',
  UNIPROT_URL: 'http://www.uniprot.org/uniprot',
  UNIPROT_CACHE_SIZE: DEFAULT_CACHE_SIZE
};

let envVars = _.pick( process.env, Object.keys( defaults ) );

let conf = Object.assign( {}, defaults, envVars );

Object.freeze( conf );

module.exports = conf;
