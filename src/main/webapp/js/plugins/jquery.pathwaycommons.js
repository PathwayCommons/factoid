;(function($){
	
	var cache = {};
	
	$.pathwaycommons = {};
	
	$.pathwaycommons.query = function(opts){
		
		var defaults = {
			url: null,
			ready: function(data){},
			error: function(cause){},
			timesToRetryOnError: 3,
			varVal: undefined,
			varName: undefined
		};
		
		var options = $.extend(true, defaults, opts);
		
		if( cache[options.url] == null ){
			cache[options.url] = {};
		}
		
		if( cache[options.url][options.varName] == null ){
			cache[options.url][options.varName] = {};
		}
		
		if( cache[options.url][options.varName][options.varVal] != null ){
			var ret = cache[options.url][options.varName][options.varVal];

			if( $.isPlainObject(ret) ){
				ret = $.extend(true, {}, ret);
			}

			typeof options.ready == "function" ? options.ready(ret) : jQuery.noop();
		} else {
			
			var times = 0;
			function attempt(msg){
				if( times < options.timesToRetryOnError ){
					times++;
					ajax();
				} else {
					typeof options.error == "function" ? options.error(msg) : jQuery.noop();
				}
			}
			
			function ajax(){
				$.ajax({
					url: util.absolute_url("proxy"),
					data: {
						url: options.url + "?" + options.varName + "=" + options.varVal
					},
					type: "GET",
					dataType: options.dataType,
					success: function(data){
						
						if( data.error != null ){
							attempt("Could not load Pathway Commons");
							return;
						}
						
						cache[options.url][options.varName][options.varVal] = data;
						typeof options.ready == "function" ? options.ready(data) : jQuery.noop();
					},
					error: function(msg){
						attempt(msg);
					}
				});
			
			}
			ajax();
		}		
		
	};
	
	$.pathwaycommons.search = function(opts){
		
		$.pathwaycommons.query( $.extend({}, opts, {
			url: "http://awabi.cbio.mskcc.org/cpath2/search.json",
			varVal: opts.search,
			varName: "q",
			dataType: "json"
		}) );
		
	};
	
	$.pathwaycommons.biopax = function(opts){
		
		$.pathwaycommons.query($.extend({}, opts, {
			url: "http://awabi.cbio.mskcc.org/cpath2/get",
			varVal: opts.uri,
			varName: "uri",
			dataType: "text"
		}));
		
	};
	
	$.pathwaycommons.match = function(opts){
		var options = $.extend(true, {
			biopaxClass: undefined, // array of types accepted
			organism: undefined, // list of organisms to accept
			maxMatches: undefined, // max number of matches to return
			error: function(msg){} // function to execute on error
		}, opts);
		
		function organismMatches(hit){
			if( options.organism == null ){
				return true;
			}
			
			var matches = false;
			$.each(hit.organism, function(i, organism){
				matches = matches || $.isInArray(organism, options.organism);
			});
			return matches;
		}
		
		function biopaxClassMatches(hit){
			var cls = hit.biopaxClass.toLowerCase();
			
			if( options.biopaxClass == null ){
				return true;
			}
			
			var ret = false;
			
			$.each(options.biopaxClass, function(i, bpCls){
				if( bpCls.toLowerCase() == cls ){
					ret = true;
				}
			});
			
			return ret;
		}
		
		$.pathwaycommons.search({
			search: options.search,
			error: function(msg){
				typeof options.error == "function" ? options.error(msg) : jQuery.noop();
			},
			ready: function(data){
				var hits = data.searchHit;
				var matches = [];
				var numOrganismNamesFound = 0;
				var numOrganismNames = 0;
				
				$.each(hits, function(i, hit){
					if( organismMatches(hit) && biopaxClassMatches(hit) && (options.maxMatches == null || matches.length < options.maxMatches) ){
						matches.push(hit);
						numOrganismNames += hit.organism.length;
					} 
				});
				
				$.each(matches, function(i, hit){
					$.each(hit.organism, function(i, organismId){
						$.pathwaycommons.biopax({
							uri: organismId,
							ready: function(data){
								if( hit.organismName == null ){
									hit.organismName = [];
								}
								
								hit.organismName.push( $(data).find("bp\\:BioSource bp\\:standardName").text() );
								numOrganismNamesFound++;
								
								if( numOrganismNamesFound == numOrganismNames ){
									typeof options.ready == "function" ? options.ready(matches) : jQuery.noop();
								}
							} // ready
						}); // biopax
					}); // each organism
				}); // each match
				
				if( matches.length == 0 ){
					typeof options.ready == "function" ? options.ready(matches) : jQuery.noop();
				}
				
			} // ready
		}); // query
		
	};
	
})(jQuery); 