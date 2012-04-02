UiState.ADD_EDGE.enter = function(opts){
	
	var interaction = opts.interaction;
	var edge_data = opts.edge_data;
	var options = opts.options;
	
	$("#vis").cursoricon({
		classes: "add-edge ui-icon ui-icon-arrowthick-1-e"
	});
	
	if( ui.add_edge_listener != null ){
		vis.unbind("click", "nodes", ui.add_edge_listener);
	}
	
	ui.add_edge_listener = function(e){
		
		var type = NodeType.fromVal(e.target.data.type);
		
		if( interaction.data.id == e.target.data.id ){
			UiState.leave(UiState.ADD_EDGE);
			ui.open_node_commandtip(e.target);
			return;
		}
		
		if( options.mustSelectInteraction && !type.interaction ){
			
			ui.open_node_messagetip(e.target, "This is not an interaction.  You must select an interaction, or you can cancel by clicking");
			
			vis.one("click", "nodes", ui.add_edge_listener);
			return;
		}
		
		if( options.mustSelectEntity && !type.entity ){
			
			ui.open_node_messagetip(e.target, "This is not an entity.  You must select an entity.");
			
			vis.one("click", "nodes", ui.add_edge_listener);
			return;
		}
		
		if( options.mustSelect ){
			
			var match = false;
			$.each(options.mustSelect.types, function(i, type){
				if( e.target.data.type == type.val ){
					match = true;
				}
			});
			
			if( !match ){
				
				var msg = "This is not " + options.mustSelect.name + ".  You must select " + options.mustSelect.name + ".";
				
				ui.open_node_messagetip(e.target, msg);
				
				vis.one("click", "nodes", ui.add_edge_listener);
				return;
			}
			
		}
		
		var interaction_id = interaction.data.id;
		var selected_id = e.target.data.id;
		
		var new_edge = $.extend(true, {}, edge_data, {
			source: options.towardsSelected ? interaction_id : selected_id,
			target: options.towardsSelected ? selected_id : interaction_id,
			interaction: interaction.data.id
		});
		
		if( options.deleteOldEdge ){
			
			var edges = vis.firstNeighbors([ interaction ]).edges;
			
			$.log("Checking edges to replace (%o) for new edge for interaction (%o) ", edges, interaction);
			
			$.each(edges, function(i, edge){
				if( edge.data.interaction == interaction.data.id ){ // only check for edges owned by same interaction
					
					function bool(val){
						if( val ){
							return true;
						} else {
							return false;
						}
					}
					
					if( options.justNodePairMatches ){
						
						if( edge.data.source == selected_id || edge.data.target == selected_id ){
							// we should have a match, since the pairs are the same
							$.log("Deleting previous node-pair-matching edge (%o) in place of edge to add", edge);
							ui.delete_edge(edge);
						}
					} else if( bool(edge.data.directed) != bool(edge_data.directed) ){
						// directed doesn't match
						$.log("Edge (%o) doesn't match since directedness is different", edge);
					} else if( bool(edge.data.bidirectional) != bool(edge_data.bidirectional) ){
						// bidirectional doesn't match
						$.log("Edge (%o) doesn't match since bidirectedness is different", edge);
					} else if( edge.data.type != edge_data.type ){
						// type doesn't match
						$.log("Edge (%o) doesn't match since type is different", edge);
					} else if( edge.data.directed && options.towardsSelected && edge.data.source != interaction.data.id ){
						// if the edge is directed towards the selected node and the source isn't the interaction, it doesn't match
						$.log("Edge (%o) doesn't match since edge should be towards selected", edge);
					} else {
						// we should have a match, since we didn't get disqualified
						$.log("Deleting previous edge (%o) in place of edge to add", edge);
						ui.delete_edge(edge);
					}
					
				}
			});
			
		}
		
		ui.add_edge(new_edge);
	};
	
	vis.one("click", "nodes", ui.add_edge_listener);

	ui.add_select_bypass(interaction);
};

UiState.ADD_EDGE.leave = function(){
	
	$("#vis").cursoricon("remove");
	
	ui.remove_select_bypass();
	vis.unbind("click", "nodes", ui.add_edge_listener);
};

ui.add_edge = function(edge_data){
	
	UiState.leave(UiState.ADD_EDGE);
	
	var id = util.generate_edge_id();
	var edge_defaults = {
		id: id,
		type: "INTERACTION"
	};
	
	var edge_to_add = $.extend(true, {}, edge_defaults, edge_data);
	vis.addEdge(edge_to_add);
	
	var added_edge = vis.edge(id);
	
	var source = vis.node( added_edge.data.source );
	var target = vis.node( added_edge.data.target );
	var neighbors = vis.firstNeighbors([ source, target ]).neighbors;
	neighbors.push(source);
	neighbors.push(target);
	ui.update_commandtips( neighbors );
	
};