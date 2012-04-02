util = {};

util.is_new_paper = function(){
	var id = $("body").attr("paper");
	return id == null || id == "";
};

util.paper_id = function(){
	return $("body").attr("paper").trim();
};

util.absolute_url = function(relativeUrl){
	return $("html").attr("contextpath") + "/" + relativeUrl;
};

util.node_id = function(node){
	var id;
	if(typeof node == typeof ""){
		id = node;
	} else {
		id = node.data("id");
	}
	
	return id;
};

util.node = function(node){
	
	if( typeof node == typeof "" ){
		var id = node;
		return cy.nodes("#" + id);
	}
	
	return node;
	
};

util.biopax = function(node, new_biopax){
	node = util.node(node);
	return node.data("biopax", new_biopax);
};

util.name = function(node, name){
	
	var node;
	
	if( typeof node == typeof "" ){
		var id = node;
		node = cy.nodes().filter("#" + id);
	}
	
	var node_ref = node;
	var type = NodeType.fromVal( node_ref.data("type") );
	var biopax = node_ref.data("biopax");
	var match = node_ref.data("match");
	var typed = node_ref.data("typed");
	var brandNew = node_ref.data("brandNew");
	
	if(name === undefined){
		var ret;
		
		// match
		if( match != null ){
			ret = match;
		}
		
		// entity
		else if( type.entity && biopax != null && biopax.entityReference != null ){
			ret = biopax.entityReference.displayName;
		} 
		
		// interaction
		else if( biopax != null ) {
			ret = biopax.displayName;
		}
		
		else if( typed != null ){
			ret = typed;
		}
		
		if( ret == null || ret == "" ){
			if( type.interaction ){
				return "An interaction";
			}
			return "Unnamed entity";
		} else {
			return ret;
		}
		
	} else {
		var biopax = node.data("biopax");
		
		if( type.entity ){
			util.biopax(node_ref).entityReference.displayName = name;
		} else {
			util.biopax(node_ref).displayName = name;
		}
		
		node_ref.data("biopax", biopax);
	}
};

util.generate_node_id = function(){
	return "n" + (+new Date);
};

util.generate_edge_id = function(){
	function int_to_id(i){
		return "e" + i;
	}
	
	for(var i = +new Date; i < (-1 >>> 1); i++){
		var id = int_to_id(i);
		if( cy.edges("#" + id).size() == 0 ){
			return id;
		}
	}
};

util.generate_interaction_name = function(node){
	if( NodeType.fromVal(node.data.type).entity ){
		return node.data.label;
	} else {
		var name = NodeType.fromVal(node.data.type).name() + " (";
		var neighbors = vis.firstNeighbors([ node ]);
		$.each(neighbors.neighbors, function(i, entity){
			name += entity.data.label + (i != neighbors.neighbors.length - 1 ? ', ' : '');
		});
		name += ")";
		return name;
	}
};

util.other_id_in_edge = function(edge, id){
	return edge.data.source != id ? edge.data.source : edge.data.target;
};

util.in_editor = function(){
	return $("#editor").size() != 0;
};
