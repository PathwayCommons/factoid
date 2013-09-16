// var Engine = require('ql.io-engine');
var _ = require('underscore')._;
var port = require('../../../port');
var http = require('http');
var request = require('request');
var form = require('form-data');

// var tablesDir = __dirname + '/tables';
// var engine = new Engine({
//   connection: 'close',
//   tables: tablesDir
// });

// create the real server side instance of the textmining api
//
// we pass the dep's s.t. the server side gets a nice, real 
// instance of the api
//
// the client side can then use an fake instance to just get
// the function names etc
module.exports = (require('../../services'))( _, http, port, request, form );
