var _ = require('underscore')._;
var config = require('../../config');
var http = require('http');
var request = require('request');
var form = require('form-data');
var nodemailer = require('nodemailer');
var libxmljs = require('libxmljs');

// create the real server side instance of the textmining api
//
// we pass the dep's s.t. the server side gets a nice, real 
// instance of the api
//
// the client side can then use an fake instance to just get
// the function names etc
module.exports = (require('../services'))( _, http, config, request, form, nodemailer, libxmljs );
