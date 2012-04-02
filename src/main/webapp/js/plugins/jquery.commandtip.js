;(function($){
	
	var last_id = 0;
	
	$.fn.commandtip = function(opts, param1, param2, param3) {
		
		var target = $(this);
		
		function api_ok(){
			var qtip_id = $(target).data("qtipid");
			return $("#" + qtip_id).size() > 0 && $("#" + qtip_id).qtip("api") != null;
		}
		
		if(opts == "api"){
			var qtip_id = $(target).data("qtipid");
			return $("#" + qtip_id).qtip("api");
		} else if(opts == "tooltip"){
			var qtip_id = $(target).data("qtipid");
			return $("#" + qtip_id);
		} else if(opts == "remove" || opts == "close" || opts == "hide"){
			var qtip_id = $(target).data("qtipid");
			api_ok() ? $("#" + qtip_id).qtip("api").forceHide() : jQuery.noop();
			return;
		} else if(opts == "reposition"){
			var qtip_id = $(target).data("qtipid");
			api_ok() ? $("#" + qtip_id).qtip("api").reposition() : jQuery.noop();
			return;
		} else if(opts == "title"){
			var qtip_id = $(target).data("qtipid");
			$("#" + qtip_id).find(".ui-tooltip-title").html( param1 );
			return;
		}
		
		return this.each(function(){
			
			var defaults = {
				title: undefined, // title text of tooltip
				content: '', // content of tooltip
				draggable: false, // can drag tooltip by title?
				close: "blur", // close tooltip on blur if "blur", not at all if false; auto after x ms if a number; on mouseout if "mouseout"
				onclose: null,
				disableCloseAfterDrag: true, // whether to disable close after dragging the tooltip; clicking x still works
				closeOnWindowResize: true,
				id: undefined, // ui-tooltip-${id}
				paper: false, // use scrollbarpaper for scrollbars,
				classes: "", // space separated like jQuery.addClass
				height: undefined, // force height of tooltip
				width: undefined, // force width of tooltip
				buttons: undefined, // list of buttons to put in the button pane at the bottom
				closeOnButtonClick: true, // close after clicking button in button pane
				position: { x: undefined, y: undefined, adjust: { x: undefined, y: undefined }, my: "top center", at: "bottom center" },
				closeOnEsc: true,
				closeTooltip: "",
				deleteTooltip: "",
				deleteButton: false,
				onDelete: null,
				alreadyOpenHighlightSpeed: 500,
				highlightOnAlreadyOpen: true
			};
			
			var qtip = {
				id: undefined,
				overwrite: false,
				content: {
		            text: undefined,
		            title: {
		                text: undefined,
		                button: 'Close'
		            }
		        },
		        show: {
	                delay: 0,
	                event: false,
	                ready: true,
	                effect: false
	            },
	            hide: {
	                delay: 0,
	                event: 	"unfocus",
	                fixed: true
	            },
	            style: {
	                tip: {
	                   width: 20,
	                   height: 10
	                }
	            },
	            position: {
	            	viewport: $(window),
	            	adjust: {
	            		resize: false
	            	}
	            },
	            events: {
	            	hide: function(){
	            		
	            		if( $.isFunction(options.onclose) ){
	    					options.onclose();
	    				}
	            		
	            		$(target).qtip("api").destroy();
	            	}
	            }
			};
		        
	        var options = $.extend(true, defaults, opts); 
	        
	        qtip.position.my = options.position.my;
	        qtip.position.at = options.position.at;
	        qtip.position.adjust.x = options.position.adjust.x;
	        qtip.position.adjust.y = options.position.adjust.y;
	        qtip.style.classes = options.classes;
	        
	        // set up qtip
	        qtip.content.title.text = options.title;
	        qtip.content.text = options.paper ? ('<div class="scrollbarpaper-wrapper">' + options.content + '</div>') : options.content;
	        if( typeof options.close == "number" ){
	        	qtip.hide = {
	        		delay: options.close,
	        		event: "hidetooltip"
	        	};
	        } else if( options.close == "blur" ) {
	        	qtip.hide.event = 'unfocus';
	        } else if( typeof options.close == "string" ){
	        	qtip.hide.event = options.close;
	        } else {
	        	qtip.hide.event = false;
	        }
        

	        var use_fake_target = options.position != null && options.position.x != null && options.position.y != null;
	        if( use_fake_target ){
	        	target = $('<div></div>');
	        	
	        	target.css({
		        	"position": "absolute",
		        	"left": options.position.x,
		        	"top": options.position.y
		        });
	        	$("body").append(target);
	        	
	        	qtip.position = {
        			my: "top center",
        			at: "bottom center",
        			viewport: $(window)
	        	};
	        } 
	        
	        var old_qtip = $( "#" + $(target).data("qtipid") );
	        if( old_qtip.size() >= 1 ){
	        	if( options.highlightOnAlreadyOpen ){
	        		$(target).effect("transfer", { to: old_qtip }, options.alreadyOpenHighlightSpeed);
	        	}
	        	return;
	        }
	        
	        if( options.adjust != null ){
	        	qtip.position.adjust = {
	        		x: options.adjust.x != null ? options.adjust.x : undefined,
					y: options.adjust.y != null ? options.adjust.y : undefined
	        	}
	        }
	        
	        qtip.id = options.id != null ? options.id : ("command-" + last_id++);
	        $(target).qtip(qtip);
	        
			var id = "ui-tooltip-" + qtip.id;
			$(target).add("#" + id).data("qtipid", id);
			
			if( typeof options.content == "object" ){
	    		$("#" + id).find(".ui-tooltip-content").empty().append(options.content);
	    	}
			
			if( qtip.hide.event == "hidetooltip" ){
				$(target).trigger("hidetooltip");
			}
			
			if( options.closeTooltip != null ){
				$("#" + id).find(".ui-tooltip-icon").attr("tooltip", options.closeTooltip);
			}
			
			if( options.deleteButton ){
				var delete_button = $('<a class="ui-state-default ui-tooltip-icon ui-tooltip-delete"><span class="ui-icon ui-icon-minusthick"></span></a>');
				
				if( options.deleteTooltip != null ){
					delete_button.attr("tooltip", options.deleteTooltip);
				}
				
				delete_button.bind("click", function(){
					if( options.closeOnDelete ){
						$("#" + id).qtip("api").forceHide();
					}
					
					if( typeof options.onDelete == typeof function(){} ){
						options.onDelete();
					}
				});
				$("#" + id).find(".ui-tooltip-titlebar").append(delete_button);
			}
			
			
			var escHandler = function(e){
				if( options.closeOnEsc && e.which == 27 && api_ok() ){
					$("#" + id).qtip("api").forceHide();
				}
			};
			
			var oldHide = $("#" + id).qtip("api").hide;
			$("#" + id).qtip("api").forceHide = function(){
				oldHide();
				
				if( use_fake_target ){
					target.remove();
				}
				
				$("body").unbind("keydown", escHandler);
			};

			$("body").bind("keydown", escHandler);
			
			$("#" + id).bind("tooltiphide", function(){
				$("body").unbind("keydown", escHandler);
			});
			
	        // make draggable
	        if( options.draggable ){
	        	var tooltip = $("#" + id);
	        	
	        	tooltip.draggable({
	        		handle: ".ui-tooltip-titlebar",
	        		containment: "window"
	        	});
	        	
	        	tooltip.one("dragstart", function(){
	        		$("#" + id).addClass("ui-tooltip-dragged");
        			$("#" + id + " .ui-tooltip-tip").hide();
        			
        			if( options.disableCloseAfterDrag ){
	        			$("#" + id).qtip("api").hide = function(event){
	        			};
	        			
	        			$("body").unbind("keydown", escHandler);
        			}
        			
        			$("#" + id + " .ui-tooltip-icon").click(function(){
        				$("#" + id).qtip("api").forceHide();
        			});
        			
        			$("#" + id).qtip("api").reposition = function(event){	        				
        			};
	        	});
	        }
	        
	        if( options.title == null ){
	        	var tooltip = $("#" + id);
	        	
	        	tooltip.addClass("ui-tooltip-no-title");
	        }
	        
	        if( options.buttons != null ){
	        	var pane = $('<div class="ui-tooltip-buttonpane ui-widget-content"></div>');
	        	
	        	$.each(options.buttons, function(index, value){
	        		
	        		var text;
	        		var click;
	        		
	        		if( typeof index == "string" ){
	        			text = index;
	        			click = value;
	        		} else {
	        			text = value.text;
	        			click = value.click;
	        		}
	        		
	        		var ele = $('<button>' + text + '</button>');
	        		ele.button();
	        		ele.bind("click", function(evt){
	        			if( click != null ){
	        				click(evt);
	        			}
	        			if( options.closeOnButtonClick ){
	        				$("#" + id).qtip("api").forceHide();
	        			}
	        		});
	        		
	        		pane.append(ele);
	        	});
	        	
	        	$("#" + id).addClass("ui-tooltip-with-buttonpane").append(pane);
	        }
	        
	        // remove the yellow tooltip
	        $("#" + id + " .ui-tooltip-icon").attr("title", null);
	        
	        // remove the x on the icon
	        $("#" + id + " .ui-icon").html(''); 
	        
	        $("#" + id).addClass("ui-tooltip-command");
	        
	        $("#" + id).append('<div class="ui-tooltip-command-bottom"></div>');

	        
	        if( options.height != null ){
	        	var tooltip = $("#" + id);
	        	var content = $("#" + id + " .ui-tooltip-content");
	        	var tip = $("#" + id + " .ui-tooltip-tip");
	        	var padding = parseInt(content.css("padding-top")) + parseInt(content.css("padding-bottom"));
	        	var usedHeight = content.offset().top - tooltip.offset().top + tip.outerHeight() + padding;
	        	
	        	content.height( options.height - usedHeight );
	        }
	        
	        if( options.width != null ){
	        	$("#" + id).width( options.width );
	        }
	        
	        $("#" + id).qtip("api").reposition();
	        
	        if( options.beforePaper ){
	        	options.beforePaper();
	        }
	        
	        if( options.paper ){
	        	var content = $("#" + id + " .ui-tooltip-content");
	        	
	        	content.addClass("ui-scrollbarpaper-added");
	        	content.scrollbarPaper();
	        }
		        
	        if( typeof options.ready == "function" ){        	
	        	options.ready();
	        }

	        $(window).one("resize", function(){
	        	if( options.disableCloseAfterDrag && $("#" + id).hasClass("ui-tooltip-dragged") ){
	        		// keep
	        	} else {
	        		$("#" + id).qtip("api").forceHide();
	        	}
	        });
		});
	}
	
})(jQuery);  