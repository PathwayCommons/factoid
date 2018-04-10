let process = require('process');
let _ = require('lodash');
let { isClient } = require('./util');

const DEFAULT_CACHE_SIZE = parseInt( process.env.DEFAULT_CACHE_SIZE ) || 1000;

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
  REACH_URL: 'http://reach.baderlab.org/api/uploadFile',
  UNIPROT_URL: 'http://www.uniprot.org/uniprot',
  UNIPROT_LINK_BASE_URL: 'http://www.uniprot.org/uniprot/',
  UNIPROT_CACHE_SIZE: DEFAULT_CACHE_SIZE,
  CHEBI_WSDL_URL: 'https://www.ebi.ac.uk/webservices/chebi/2.0/webservice?wsdl',
  CHEBI_JAVA_PACKAGE: 'uk.ac.ebi.chebi.webapps.chebiWS.model',
  CHEBI_LINK_BASE_URL: 'https://www.ebi.ac.uk/chebi/searchId.do?chebiId=',
  CHEBI_CACHE_SIZE: DEFAULT_CACHE_SIZE,
  PUBCHEM_BASE_URL: 'https://pubchem.ncbi.nlm.nih.gov/rest/pug',
  PUBCHEM_LINK_BASE_URL: 'https://pubchem.ncbi.nlm.nih.gov/compound/',
  PUBCHEM_CACHE_SIZE: DEFAULT_CACHE_SIZE,
  AGGREGATE_CACHE_SIZE: DEFAULT_CACHE_SIZE,
  MAX_SEARCH_SIZE: 50
};

let envVars = _.pick( process.env, Object.keys( defaults ) );

for( let key in envVars ){
  let val = envVars[key];

  if( val === '' || val == null ){
    delete envVars[key];
  }
}

let conf = Object.assign( {}, defaults, envVars );

let intKeys = [
  'PORT', 'DB_PORT',
  'UNIPROT_CACHE_SIZE', 'CHEBI_CACHE_SIZE', 'MAX_SEARCH_SIZE'
];

intKeys.forEach( k => conf[k] = parseInt( conf[k] ) );

Object.freeze( conf );

module.exports = conf;
