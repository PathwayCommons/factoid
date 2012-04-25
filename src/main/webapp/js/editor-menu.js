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
		    	icon: "ui-icon-noun ui-icon-delete",
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
				icon: "ui-icon-noun ui-icon-share",
				attr: {
					id: "menubar-layout"
				},
				labelAttr: {
					tooltip: $.i18n("menu.layout.tooltip")
				},
				select: function(){ ui.relayout(); }
			},
		    
		    {
				icon: "ui-icon-noun ui-icon-pan",
				checkable: true,
				checked: true,
				attr: {
					id: "menubar-show-pan-zoom"
				},
				labelAttr: {
					tooltip: $.i18n("menu.show_pan_zoom.tooltip")
				},
				select: function(on){
					var pz = $("#vis > .ui-cytoscapeweb-panzoom");
					
					if( on ){
						pz.show();
					} else {
						pz.hide();
					}
				}
			},

			{
				icon: "ui-icon-noun ui-icon-information-alt-2",
				attr: {
					id: "menubar-info"
				},
				labelAttr: {
					tooltip: $.i18n("menu.info.tooltip")
				},
				select: function(){
					$("#menubar-info").commandtip({
						title: "Factoid - Building the Future of Scientific Publishing",
						content: "<p>Factoid helps authors to translate their written scientific text into formal descriptions of biological processes useful for sharing their results with others, bioinformatics analysis and integrating with other data to help build a more complete model of a cell.</p>\
								<p>Factoid aims to be part of the publication process.  With the author's help, it will extract pathway and related information from a paper as it is submitted, submit the resulting diagram as a visual abstract for peer-review along with the paper and finally, publish the information in a sharable and computable format accompanying the paper for others to use.</p>\
								<p>Factoid 1.0 helps turn text into a simple and editable network model of a biological process. Text is automatically converted to a first draft of a network which can then be corrected using easy to use editing functions.  Future versions will have more advanced text mining functionality to improve the 'first draft', will allow saving the results in standard formats for sharing and will make it easier to add text and edit the network.</p>"
					});
				}
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