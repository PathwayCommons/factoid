$(function(){
	
	// don't use script unless the editor exists
	if( !util.in_editor() ){
		return;
	}
	
	var $undo = $("#menubar-undo");
	var $redo = $("#menubar-redo");
	var $undol = $("#menubar-undo [tooltip]");
	var $redol = $("#menubar-redo [tooltip]");
	
	function updateMenuTooltips(){
		var undo = $.operation.undoMessage();
		var redo = $.operation.redoMessage();
		
		$undol.attr( "tooltip", undo ? 'Undo <strong>' + undo + '</strong>' : $.i18n("menu.undo.tooltip") );
		$redol.attr( "tooltip", redo ? 'Redo <strong>' + redo + '</strong>' : $.i18n("menu.redo.tooltip") );
	}
	
	// show tooltips after clicking
	$undo.bind("menuselect", function(){
		if( $.operation.undoable() ){
			$undol.trigger("mouseover");
		}
	});
	$redo.bind("menuselect", function(){
		if( $.operation.redoable() ){
			$redol.trigger("mouseover");
		}
	});
	
	// update tooltips on exec, redo, undo
	$.operation.bind(function(){
		updateMenuTooltips();
	});
	
	$.operation.configure({
		showLink: false,
		
		undoTime: 2000,
		
		position: function(){
			// do nothing
		},
		
		hide: function(){
			$(".ui-tooltip-undo").fadeOut(250, function(){
				$(".ui-tooltip-undo").remove();
			});
		},
		
		remove: function(){
			$(".ui-tooltip-undo").remove();
		},
		
		dialog: function( $content ){
			$("#menubar-undo").qtip({
				id: "undo",
				content: {
					text: $content
				},
				show: {
	                delay: 0,
	                event: false,
	                ready: true,
	                effect: false
	            },
	            hide: {
	                delay: 0,
	                event: 	false,
	                fixed: false,
	                effect: false
	            },
	            style: {
	                tip: {
						width: 12,
					    height: 6
					},
	                classes: "ui-tooltip-undo"
	            },
	            position: {
	            	my: "top center",
	            	at: "bottom center",
	            	viewport: $(window),
	            	adjust: {
	            		resize: false
	            	}
	            }
			});
		}
	});
	
});