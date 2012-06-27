var http = require("http");
var $_ = require("underscore");
var querystring = require("querystring");

var globals = {};

function mine( options, callback ){
	options = $_.defaults(options, {
		text: "" // text to mine
	});

	// submit paper to system
	function submit( success ){
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
			res.setEncoding('utf8');

			res.on("data", function( id ){
				success(id);
			});

			res.on("error", function(e){
				callback( new Error("Could not submit text for textmining") );
			});
		});

		req.write( postData );
		req.end();
	}

	function parse( id, success ){
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
			res.setEncoding('utf8');

			res.on("data", function( data ){
				var matches;				
				var ret = [];

				// the json data we get could be malformed
				try {
					matches = JSON.parse( data );
				} catch(e){
					callback(e);
					return;
				}

				$_.each(matches, function(match){
					var start = match[0];
					var end = match[1];
					var something = match[2];
					var name = match[3];
					var type = match[4];

					ret.push({
						name: name,
						type: type
					});
				});

				success( ret );
			});

			res.on("error", function(e){
				callback( new Error("Could not parse text for textmining") );
			});
		});

		req.write( postData );
		req.end();
	}

	// submit paper
	submit(function(id){

		// parse paper results, and send off to the callback
		parse(id, function(matches){
			callback(null, matches);
		});
	});
}

// TODO entity recognition from ensembl
function recognize(  ){}

// configure global textmining options (useful for things like debug/production configs)
function configure( options ){
	globals = $_.defaults(options, {
		caching: false
	});
}
configure({}); // populate defaults

// define exports
exports.configure = configure;
exports.mine = mine;