$(function(){
	
	// don't use script unless the editor exists
	if( !util.in_editor() ){
		return;
	}
	
	$.loadingdialog({
		title: "Loading"
	});
	
	var $vis = $("#vis");
	
	$vis.cy(function(){
		var cy = $vis.cy("get");
		
		cy.bind("layoutstart", function(){
			$vis.cytoscapewebEdgehandles("disable");
		}).bind("layoutstop", function(){
			$vis.cytoscapewebEdgehandles("enable");
		});
	});
	
	
});