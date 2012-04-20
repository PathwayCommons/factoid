ui.load_network = function(json){
	
	$.loadingdialog();
	
	// make sure the layout has the right sizes for things
	// when we load the graph
	$("#vis").trigger("resizelayout");
	
	cy.load(json, function(){
		$("#vis").cytoscapewebPanzoom({
			staticPosition: true
		});
		
		$("#vis").cytoscapewebEdgehandles({
			lineType: "straight",
			preview: true,
			handleSize: 12,
			handleColor: "#d18aa1",
			edgeType: function(source, target){
				if( source.edgesWith(target).size() > 0 ){
					console.log("already edges");
					return null; // don't add edges if there's one already
				} else if( source.add(target).filter("[type='Interaction']").size() > 0 ){
					return "flat";
				} else {
					return "node";
				}
			},
			nodeParams: function(){
				return {
					data: {
						type: "Interaction"
					}
				};
			},
			edgeParams: function(){
				return {
					data: { type: "Interaction" }
				}
			}
		});
		
		// initial counts update
		ui.update_entity_counts();
		
		setTimeout(function(){
			$.loadingdialog("destroy");
		}, 100);
	});
	
};
