let http = require('express').Router();

[
  require('./document'),
  require('./element-association')
].forEach( defineRoutes => defineRoutes( http ) );

module.exports = http;
