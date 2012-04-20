$(function(){
	
	$.operation.add({
		id: "addEdges",
		
		defaults: {
			
		},
		
		message: function(options){
			var src = util.name(options.source);
			var tgt = util.name( options.targets.eq(0) );
			var n = options.targets.size();
	
			return src + " connected to " + tgt +
				( n > 1 ? " and " + (n - 1) + " other " + (n - 1 == 1 ? "entity" : "entities") : "" );
		},
		
		exec: function(options){
			// if we're just recording then don't actually do anything
			if( options.record ){
				options.record = false;
				return;
			}
			
			options.added.restore();
		},
		
		undo: function(options){
			options.added.remove();
		}
	});

});