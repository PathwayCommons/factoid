$(function(){
	
	if( !util.in_editor() ){
		return;
	}
	
	function empty(str){
		return str == null || str == "";
	}
	
	var moutTimeout;
	var moverTimeout;
	var moverDelay = 1000;
	var moutDelay = 150;
	
	$("#vis").cy(function(){
		
		cy.nodes().live("mouseover mousemove", function(){
			var match = this.data("match");
			
			if( !empty(match) && !this.is(":grabbed") ){
				clearTimeout(moverTimeout);
				moverTimeout = setTimeout(function(){
					ui.highlight_match(match);
				}, moverDelay);
			}
		}).live("mouseout", function(){
			var match = this.data("match");
			
			if( !empty(match) ){
				clearTimeout(moverTimeout);
				clearTimeout(moutTimeout);
				moutTimeout = setTimeout(function(){
					ui.unhighlight_match(match);
				}, moutDelay);
			}
		}).live("mousedown mouseup", function(){

			clearTimeout(moverTimeout);
			clearTimeout(moutTimeout);
		});
		
	});
	
	$(".ui-textselect-match").live("mouseenter mousemove", function(){
		var $this = $(this);
		var $matches = $("#side-data").find(".ui-textselect-match[match='" + $this.attr("match") + "']");
		var $close = $(".ui-textselect-close");
		var highlighted = $this.hasClass("ui-textselect-highlight");
		
		if( highlighted ){
			return; // if highlighted, don't trigger hover stuff
		}
		
		if( $matches.size() > 1 ){
			$close.addClass("just-remove");
			$close.attr("tooltip",  $.i18n("textmining.delete_icon.remove.tooltip", $matches.size() - 1) );
		} else {
			$close.removeClass("just-remove");
			$close.attr("tooltip",  $.i18n("textmining.delete_icon.tooltip") );
		}
		
		clearTimeout(moverTimeout);
		moverTimeout = setTimeout(function(){
			var match = $this.text();
			
			ui.highlight_match( match );
			ui.highlight_match_node( match );
		}, moverDelay);
	}).live("mouseleave", function(){
		var $this = $(this);
		
		clearTimeout(moutTimeout);
		clearTimeout(moverTimeout);
		moutTimeout = setTimeout(function(){
			var match = $this.text();
			
			ui.unhighlight_match_node( match );
			ui.unhighlight_match( match );
		}, moutDelay);
	}).live("mousedown", function(){
		clearTimeout(moverTimeout);
	});
	
	
});