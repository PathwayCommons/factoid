ui.update_commandtips = function(nodes){
	
	if( nodes == null || nodes.size() == 0 ){
		return;
	}
	
	var regenerated_ids = [];
	
	nodes.each(function(i, entity){
		var id = entity.data("id");
		var type = NodeType.fromVal( entity.data("type") );

		if( type.interaction && !$.isInArray(id, regenerated_ids) ){
			regenerated_ids.push( id );
			$(".command-tip[node="+ id +"]").commandtip("tooltip").trigger("generate");
		}
	});
	
};