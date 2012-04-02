/* (c) 2009
   AUTHORS: Max Franz
   LICENSE: TODO
*/

;(function($){
	
	var defaults = {
		
	};
	
	$.fn.tooltip = function(opts){	
		var options = $.extend(true, {}, defaults, opts);
		var self = this;
		
		var parameters = {
			bottom: {
				position: {
					my: "top center",
					at: "bottom center"
				},
				tip: {
					width: 12,
				    height: 6
				}
			},
			top: {
				position: {
					my: "bottom center",
					at: "top center"
				},
				tip: {
					width: 12,
				    height: 6
				}
			},
			left: {
				position: {
					my: "right center",
					at: "left center"
				},
				tip: {
				    height: 12,
				    width: 10
				}
			},
			right: {
				position: {
					my: "left center",
					at: "right center"
				},
				tip: {
				    height: 12,
				    width: 10
				}
			}
		};
		
		$("[tooltip]").live("mouseover", function(e){
			var defaultPosition = "bottom";
			var self = this;
			var tagName = $(self).prop("tagName").toLowerCase();
			var $target = $(e.toElement);
			var targetIsChild = $target.parents().is(self);
			var targetHasTooltip = $target.attr("tooltip") != null;
			
			if( targetIsChild ){
				var $ele = $target;
				while( $ele[0] != self ){
					targetHasTooltip = targetHasTooltip || $ele.attr("tooltip") != null;
					$ele = $ele.parent();
				}
			}
			
//			console.log(e, targetIsChild, targetHasTooltip, targetIsChild && targetHasTooltip);
			
			if( $target[0] != self ){
				if( targetIsChild && targetHasTooltip ){
					return;
				} 
			}
			
			var attr = ($(this).attr("tipposition") || "").toLowerCase();
			var params = parameters[attr];
			params == null ? params = parameters["bottom"] : $.noop();
			
			$("body").qtip({
				id: "attribute",
				content: {
					text: $(this).attr("tooltip")
				},
				show: {
	                delay: 0,
	                event: false,
	                ready: true,
	                effect: false
	            },
	            hide: {
	                delay: 0,
	                event: 	"mouseout mousedown",
	                fixed: false,
	                effect: false
	            },
	            style: {
	                tip: params.tip,
	                classes: "ui-tooltip-attribute"
	            },
	            position: $.extend(true, {}, params.position, {
	            	target: $(self),
	            	viewport: $(window),
	            	adjust: {
	            		resize: false
	            	}
	            }),
	            events: {
	            	hide: function(){
	            		var api = $("#ui-tooltip-attribute").qtip("api");
	            		api != null && api.destroy();
	            	}
	            }
			});
			
		}).live("mouseout", function(){
			
		});
		
	};
     
})(jQuery);  