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
				if( source.add(target).filter("[type='Interaction']").size() > 0 ){
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
