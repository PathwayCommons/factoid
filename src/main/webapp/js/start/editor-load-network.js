ui.load_network = function(json){
	
	$.loadingdialog();
	
	// make sure the layout has the right sizes for things
	// when we load the graph
	$("#vis").trigger("resizelayout");
	
	// when null layout is done, load the real layout
	cy.one("layoutstop", function(){
		ui.relayout();
	});

	cy.load(json, function(){
		$("#vis").cytoscapewebPanzoom({
			staticPosition: true
		});
		
		$("#vis").cytoscapewebEdgehandles({
			enabled: false, // gets enabled on layoutstop
			lineType: "straight",
			preview: true,
			handleSize: 12,
			handleColor: "#5CC2ED",
			edgeType: function(source, target){
				if( source.edgesWith(target).size() > 0 ){
					return null; // don't add edges if there's one already
				} else if( source.add(target).filter(".interaction").size() > 0 ){
					return "flat";
				} else {
					return "node";
				}
			},
			
			nodeParams: function(){
				return {
					data: {
						type: "Interaction"
					},
					classes: "interaction"
				};
			},
			edgeParams: function(){
				return {
					data: {
						type: "Interaction"
					}
				}
			},
			
			complete: function( sourceNode, targetNodes, addedEntities ){
				addedEntities.edges().each(function(i, edge){
					var interaction = edge.neighborhood(".interaction");

					edge.data( "interaction", interaction.id() );
				});

				$.operation.exec("addEdges", {
					record: true, // just record the already performed op
					source: sourceNode,
					targets: targetNodes,
					added: addedEntities
				});
			}
		});
		
		// initial counts update
		ui.update_entity_counts();

		setTimeout(function(){
			$.loadingdialog("destroy");
		}, 100);
	});
	
};
