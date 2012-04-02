$(function(){
	
	// don't use script unless the editor exists
	if( !util.in_editor() ){
		return;
	}
	
	$("body").bind("keydown", function(evt){

		if( $(document.activeElement).is("input, textarea") ){
			return; // only use keydowns when not typing
		}
		
		if( evt.which == 8 || evt.which == 46 ){ // delete or backspace
			var selected = cy.elements(":selected");
			
			if( selected.size() > 0 ){
				$.operation.exec("delete", {
	    			elements: selected
	    		});
			}
			return false;
		}
		
		if( evt.which == 90 && evt.metaKey ){ // command z
			if( $.operation.undoable() ){
				$.operation.undo();
			}
			return false;
		}
		
		if(
			(evt.which == 90 && evt.metaKey && evt.shiftKey) || // command shift z
			(evt.which == 89 && evt.metaKey) // command y
		){
			if( $.operation.redoable() ){
				$.operation.redo();
			}
			return false;
		}
		
		if( evt.which == 187 ){ // +
			$.operation.exec("addNode");
			return false;
		}	
			
		if( evt.which == 27 ){ // escape
			UiState.enter(UiState.INIT);
			return false;
		}
	}); 
	
});