$(function(){
	
	// don't use script unless the editor exists
	if( !util.in_editor() ){
		return;
	}
	
	$("#vis").bind("resizelayout", function(){
		editor_layout.resizeAll();
	});
	
	// layout the visualisation
	editor_layout = $("#editor").layout({

        defaults: {
            size: "auto",
            resizable: false,
            fxName: "drop",
            fxSettings: { direction: "right" },
            fxSpeed: 250,
            spacing_open: 0,
            spacing_closed: 0
        },
        
        center: {
            paneSelector: "#content"
        },
        
        north: {
        	paneSelector: "#menubar"
        }
	});
	
	content_layout = $("#content").layout({
		
		defaults: {
            size: "auto",
            resizable: false,
            fxName: "hide",
            fxSpeed: 0,
            spacing_open: 0,
            spacing_closed: 0
        },
        
        center: {
            paneSelector: "#vis"
        },
        
        east: {
        	paneSelector: "#side",
        	size: $("#side").width()
        }
		
	});
	
	side_layout = $("#side").layout({
		
		defaults: {
            size: "auto",
            resizable: false,
            fxName: "hide",
            fxSpeed: 0,
            spacing_open: 0,
            spacing_closed: 0
        },
        
        center: {
            paneSelector: "#side-data"
        },
        
        north: {
        	paneSelector: "#side-status"
        }
		
	});
	
	
	// hide the side pane on close button click
	$("#side-close-button").bind("mousedown", function(){
		$("#editor").addClass("side-closed").removeClass("side-open");
		editor_layout.hide("east");
	});
	
	// show the side pane on open button click
	$("#side-open-button").bind("mousedown", function(){
		$("#editor").removeClass("side-closed").addClass("side-open");
		editor_layout.show("east");
	});
	
});