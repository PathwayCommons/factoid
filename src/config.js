let process = require('process');
let _ = require('lodash');

let defaults = {
  PORT: 3000
};

let envVars = _.pick( process.env, Object.keys( defaults ) );

let conf = Object.assign( {}, defaults, envVars );

Object.freeze( conf );

module.exports = conf;
