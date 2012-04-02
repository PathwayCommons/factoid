ui.generate_commandtip = function(node, tip_div, callback){
	
	var type = NodeType.fromVal( node.data("type") );
	
	if( type.entity ){
		ui.generate_entity_commandtip(node, tip_div, callback);
	} else {
		ui.generate_interaction_commandtip(node, tip_div, callback);
	}
};