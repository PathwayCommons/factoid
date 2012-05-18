var http = require("http");
var us = require("underscore");
var querystring = require("querystring");

var globals = {};

function mine( options, callback ){
	options = us.defaults(options, {

	});

	// submit paper to system
	function submit( callback ){
		var postData = querystring.stringify({
			"_format": "raw",
			"text": options.text
		});

		var req = http.request({
			hostname: "factoid.bioinfo.cnio.es",
			path: "/Factoid/add_doc",
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
				"Content-Length": postData.length
			}
		}, function( res ){
			res.on("data", function( id ){
				parse( id, callback );
			});

			res.on("error", function(){
				error({
					reason: "Could not submit text"
				}, callback);
			});
		});

		req.write( postData );
		req.end();
	}

	function parse( id, callback ){
		 var postData = querystring.stringify({
			"_format": "json",
			"docid": id
		});

		var req = http.request({
			hostname: "factoid.bioinfo.cnio.es",
			path: "/Factoid/abner",
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
				"Content-Length": postData.length
			}
		}, function( res ){
			res.on("data", function( data ){
				// TODO handle data
			});

			res.on("error", function(){
				error({
					reason: "Could not parse text"
				}, callback);
			});
		});

		req.write( postData );
		req.end();
	}

	function error( options, callback ){
		callback( us.defaults(options, {
			error: true,
			reason: "Nothing specific"
		}) );
	}

	submit( callback );
}

// configure global textmining options (useful for things like debug/production configs)
function configure( options ){
	globals = us.defaults(options, {
		caching: false
	});
}
configure({}); // populate defaults

// define exports
exports.configure = configure;
exports.mine = mine;