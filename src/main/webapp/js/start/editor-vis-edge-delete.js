ui.delete_edge = function(edge){
	UiState.leave(UiState.DELETE_EDGE);
	vis.removeEdge(edge);
	ui.update_commandtips([ vis.node(edge.data.target), vis.node(edge.data.source) ]);
};

ui.delete_edges = function(edges){
	UiState.leave(UiState.DELETE_EDGE);
	vis.removeElements(edges);
	
	var ids = [];
	var nodes = [];
	$.each(edges, function(i, edge){
		function add(id){
			if( !$.isInArray(id, ids) ){
				ids.push(id);
				nodes.push( vis.node(id) );
			}
		}
		
		add(edge.data.target);
		add(edge.data.source);
	});
	ui.update_commandtips(nodes);
}

UiState.DELETE_EDGE.enter = function(opts){
	var interaction = opts.interaction;
	
	$("#vis").cursoricon({
		classes: "delete-edge ui-icon ui-icon-closethick"
	});
	
	ui.add_select_bypass(interaction);
	
	if( ui.delete_edges_node_listener != null ){
		vis.unbind("click", "nodes", ui.delete_edges_node_listener);
	}
	if( ui.delete_edges_edge_listener != null ){
		vis.unbind("click", "edges", ui.delete_edges_edge_listener);
	}
	
	ui.delete_edges_node_listener = function(evt){
		var node = evt.target;
		vis.unbind("click", "edges", ui.delete_edges_edge_listener);
		var i_edges = vis.firstNeighbors([ interaction ]).edges;
		
		var edges_to_delete = [];
		$.each(i_edges, function(i, edge){
			if( edge.data.target == node.data.id || edge.data.source == node.data.id ){
				edges_to_delete.push(edge);
			}
		});
		
		ui.delete_edges(edges_to_delete);
	};
	ui.delete_edges_edge_listener = function(evt){
		vis.unbind("click", "nodes", ui.delete_edges_node_listener);
		
		ui.delete_edge(evt.target);
	};
	
	vis.one("click", "nodes", ui.delete_edges_node_listener);
	vis.one("click", "edges", ui.delete_edges_edge_listener);
};

UiState.DELETE_EDGE.leave = function(){
	
	if( ui.delete_edges_node_listener != null ){
		vis.unbind("click", "nodes", ui.delete_edges_node_listener);
	}
	if( ui.delete_edges_edge_listener != null ){
		vis.unbind("click", "edges", ui.delete_edges_edge_listener);
	}
	
	$("#vis").cursoricon("remove");
	
	ui.remove_select_bypass();
};