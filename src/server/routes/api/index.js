let http = require('express').Router();

http.use('/element-association', require('./element-association'));
http.use('/document', require('./document'));

module.exports = http;
