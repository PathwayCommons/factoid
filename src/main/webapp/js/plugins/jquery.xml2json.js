
;(function($){	
	$.xml2json = function(options){
		var parent = {};
		var xml = options.xml;
		var cytowebFormat = options.cytowebFormat;
		
		// parent json obj
		// value to add to parent
		// name of value
		function append_json(parent, value, name){
			var matchName = name.toLowerCase();
			matchName = cytowebFormat ? matchName.replace(/-/gi, "") : matchName;
			var match = matchName.match(/(.+):(.+)/);
			var sanitisedMatchName;
			
			if( cytowebFormat && match ){
				sanitisedMatchName = match[2];
			} else {
				sanitisedMatchName = matchName;
			}
			
			if( parent[sanitisedMatchName] == null ){
				parent[sanitisedMatchName] = value;
			} else if( !$.isArray(parent[sanitisedMatchName]) ){
				var old = parent[sanitisedMatchName];
				parent[sanitisedMatchName] = [ old, value ];
			} else {
				parent[sanitisedMatchName].push(value);
			}
		}
		
		function handle_node(parent, node){
			var name = $(node).get(0).tagName;
			var value = {}; 

			if( $(node).children().size() == 0 ) {
				value["value"] = $(node).text();
			}
			
			if( $(node).get(0).attributes != null ){
				$.each($(node).get(0).attributes, function(i, attr){
					if( attr.name != null ){
						append_json(value, attr.value, attr.name);
					}
				});
			} 
			
			$(node).children().each(function(){
				handle_node(value, $(this), cytowebFormat);
			});
			
			if( name != null ){
				append_json(parent, value, name);
//				console.log(parent);	
			}
		}
		
		$(xml).each(function(){
			handle_node( parent, $(this) );
		});
		
//		console.log(parent);
		return parent;
	};
	
})(jQuery);
