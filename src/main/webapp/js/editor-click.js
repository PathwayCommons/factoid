$(function(){
	
	// don't use script unless the editor exists
	if( !util.in_editor() ){
		return;
	}
	
	$("#vis").cy(function(){
		
		cy.nodes().live("click", function(evt){
			
			if( UiState.inside(UiState.INIT) && !evt.shiftKey ){
				ui.open_node_commandtip( this );
			}
		});
		
		cy.bind("zoom", function(){
			$(".entity-tooltip").not(".ui-tooltip-dragged").commandtip("remove");
		});
		
	});
	
});