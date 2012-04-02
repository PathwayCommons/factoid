;(function($){
	
	$.fn.cursoricon = function(opts, param1){
		
		if( opts == "remove" || opts == "destroy" ){
			$(this).find(".ui-cursor-icon").remove();
			return;
		} else if( opts == "icon" || opts == "get" ){
			return $(this).find(".ui-cursor-icon");
		} else if( opts == "hide" ){
			$(this).find(".ui-cursor-icon").hide();
			$(this).data("hideicon", true);
			return;
		} else if( opts == "show" ){
			$(this).data("hideicon", false);
			return;
		}
		
		var defaults = {
			// default z-index for the cursor icon div
			zIndex: 9999999,
			
			// classes to add to the cursor icon (use this to add classes like ui-icon-foo)
			// set the cursor icon visual style in your css
			classes: ""
	    };
		options = $.extend(defaults, opts);
		
		var icon = $('<div class="ui-cursor-icon"></div>');
		icon.attr("style", "position: absolute;")
			.css("z-index", options.zIndex)
			.addClass(options.classes);
	
		$(this).append(icon);
		
		icon.hide();
			
		$(this).bind("mousemove", function(evt){
			if ($(this).data("hideicon")) return;
			
			var icon = $(this).find(".ui-cursor-icon");
			
			icon.show();
			icon.position({
				my: "right bottom",
				at: "left top",
				of: evt,
				offset: "-2 -2"
			});
		}).bind("mouseleave", function(){
			if ($(this).data("hideicon")) return;
			
			var icon = $(this).find(".ui-cursor-icon");
			
			icon.hide();
		}).bind("mouseenter", function(){
			if ($(this).data("hideicon")) return;
			
			var icon = $(this).find(".ui-cursor-icon");
			
			icon.show();
		});
		
		return this;
	};
	
})(jQuery); 