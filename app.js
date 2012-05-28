
/**
 * Module dependencies.
 */

var express = require('express');
var app = module.exports = express.createServer();
var piler = require("piler");
var io = require('socket.io').listen(app);
var routes = require("./routes");

var js = piler.createJSManager();
var css = piler.createCSSManager();

// Configuration

app.configure(function(){
	app.set('views', __dirname + '/views');
	app.set('view engine', 'jade');
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.use(app.router);
	app.use(express.static(__dirname + '/public'));
	
	// node-pile config
	js.bind(app);
	css.bind(app);
	
	// css
	var cssdir = __dirname + "/public/stylesheets";
	css.addFile( cssdir + "/reset.css" );
	css.addFile( cssdir + "/style.less" );
	
	// editor css
	css.addFile( "editor", cssdir + "/editor.less" );
	
	// js
	var jsdir = __dirname + "/public/javascripts";
	js.addFile( jsdir + "/lib/jquery-1.7.2.js" );
	js.addFile( jsdir + "/lib/modernizr-2.5.3.js" );
	js.addFile( jsdir + "/lib/chai.js" );
	js.addFile( jsdir + "/lib/underscore.js" );
	js.addFile( jsdir + "/lib/backbone.js" );
	js.addFile( jsdir + "/lib/require-stub.js" );
	
	// editor js
	var modeldir = __dirname + "/model";
	js.addFile( "editor", modeldir + "/entity.js" );
	js.addFile( "editor", modeldir + "/interaction.js" );

	
});

app.configure('development', function(){
	app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
	
	// use socket.io to live update css in the browser
	js.liveUpdate( css, io );

	textmining.configure({
		caching: false
	});
});

app.configure('production', function(){
	app.use(express.errorHandler());

	textmining.configure({
		caching: true
	});
});

// define the routes
routes.listen( app );

app.listen(3000, function(){
	console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
});
