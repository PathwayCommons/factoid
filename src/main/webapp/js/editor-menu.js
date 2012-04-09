	$(function(){
	
	// don't use script unless the editor exists
	if( !util.in_editor() ){
		return;
	}
		
	$("#menubar").menubar({
		items: [
		    {
		    	icon: "ui-icon-noun ui-icon-upload-alt-1",
		    	//name: $.i18n("menu.save.name"),
		    	//disabled: true,
		    	attr: {
		    		id: "menubar-save"
		    	},
		    	labelAttr: {
		    		tooltip: $.i18n("menu.save.tooltip")
		    	},
		    	select: function(){ ui.save(); }
		    },
		    
		    {
		    	icon: "ui-icon-noun ui-icon-arrow-alt-7",
		    	//name: $.i18n("menu.undo.name"),
		    	attr: {
		    		id: "menubar-undo"
		    	},
		    	labelAttr: {
		    		tooltip: $.i18n("menu.undo.tooltip")
		    	},
		    	select: function(){
		    		$.operation.undo();
		    	},
		    },
		    
		    {
		    	icon: "ui-icon-noun ui-icon-arrow",
		    	//name: $.i18n("menu.undo.name"),
		    	attr: {
		    		id: "menubar-redo"
		    	},
		    	labelAttr: {
		    		tooltip: $.i18n("menu.redo.tooltip")
		    	},
		    	select: function(){
		    		$.operation.redo();
		    	},
		    },
		    
		    {
		    	icon: "ui-icon-noun ui-icon-plus",
		    	//name: $.i18n("menu.add_entity.name"),
		    	attr: {
		    		id: "menubar-add-entity"
		    	},
		    	labelAttr: {
		    		tooltip: $.i18n("menu.add_entity.tooltip")
		    	},
		    	select: function(){
		    		$.operation.exec("addNode");
		    	},
		    },
		    
		    {
		    	icon: "ui-icon-noun ui-icon-minus",
		    	//name: $.i18n("menu.delete.name"),
		    	attr: {
		    		id: "menubar-delete"
		    	},
		    	labelAttr: {
		    		tooltip: $.i18n("menu.delete.tooltip")
		    	},
		    	select: function(){
		    		$.operation.exec("delete", {
		    			elements: cy.$("node:selected")
		    		});
		    	},
		    },
		    
		    {
		    	name: $.i18n("menu.more.name"),
		    	attr: {
		    		id: "menubar-more"
		    	},
		    	labelAttr: {
		    		tooltip: $.i18n("menu.more.tooltip")
		    	},
		    	open: function(){
		    		$(".ui-tooltip-undo").remove();
		    	},
		    	items: [
		    	    { 
		    	    	name: $.i18n("menu.layout.name"),
				    	attr: {
				    		id: "menubar-layout"
				    	},
				    	labelAttr: {
				    		tooltip: $.i18n("menu.layout.tooltip"),
				    		tipposition: "left"
				    	},
				    	select: function(){ ui.relayout(); }
		    	    },
		    	    {
		    	    	name: $.i18n("menu.show_pan_zoom.name"),
		    	    	checkable: true,
		    	    	checked: true,
				    	attr: {
				    		id: "menubar-show-pan-zoom"
				    	},
				    	labelAttr: {
				    		tooltip: $.i18n("menu.show_pan_zoom.tooltip"),
				    		tipposition: "left"
				    	},
				    	select: function(on){
				    		var pz = $("#vis > .ui-cytoscapeweb-panzoom");
				    		
				    		if( on ){
				    			pz.show();
				    		} else {
				    			pz.hide();
				    		}
				    	}
		    	    }
		    	]
		    }
		]
	});
	
	// set up delete button enable/disable
	$("#vis").cy(function(){
		var $del = $("#menubar-delete");
		
		function set(){
			if( cy.$("node:selected").size() > 0 ){
				$del.menubar("enable");
			} else {
				$del.menubar("disable");
			}
		}
		
		// set on selection changed
		cy.elements().live("select unselect", function(){
			set();
		});
		
		set(); // initial set
	});
	
	// set up undo/redo enable/disable
	$("#vis").cy(function(){
		var $undo = $("#menubar-undo");
		var $redo = $("#menubar-redo");
		
		function set(){
			if( $.operation.undoable() ){
				$undo.menubar("enable");
			} else {
				$undo.menubar("disable");
			}
			
			if( $.operation.redoable() ){
				$redo.menubar("enable");
			} else {
				$redo.menubar("disable");
			}
		}
		
		$.operation.bind(function(){
			set();
		});
		
		set(); // initial set
	});
	
});