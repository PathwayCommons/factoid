
(function(){
	var timeout;
	var speed = 250;
	var faded = 0.5;
	
	function show( $ele, highlight ){
		if( highlight ){
			$ele.addClass("highlighted");
		} else {
			$ele.removeClass("highlighted");
		}
		$ele.stop().animate({ opacity: 1 }, speed);
	}
	
	function hide( $ele ){
		$ele.removeClass("highlight").stop().animate({ opacity: faded }, speed);
	}
	
	ui.highlight_match = function(match){
		match = match.toLowerCase();
		
		var $matches = $("#side-data").find(".ui-textselect-match[match='"+ match +"']");
		var $unmatches = $("#side-data").find(".ui-textselect-match[match!='"+ match +"']");
		
		show( $matches, true );
		hide( $unmatches );
		hide( $("#side-data").find(".ui-textselect-text") );
		
		$("#side-data").find(".sentence").each(function(){
			var $sentence = $(this);
			var $button = $sentence.children(".sentence-type-button");
			var $expand_button = $sentence.children(".sentence-expand-button");
			var matches = $sentence.find(".ui-textselect-match[match='"+ match +"']").size() > 0;
			
			if( matches ){
				show( $button );
				show( $expand_button );
			} else {
				hide( $button );
				hide( $expand_button );
			}
		});
		
		function matchVisible( $match ){
			var $container = $("#side-data");
			var top = $container.offset().top;
			var bottom = $container.height() + top;
			
			var mtop = $match.offset().top;
			var mbottom = $match.height() + mtop;
			
			return mtop >= top && mbottom <= bottom;
		}
		
		function matchesVisible( $matches ){
			
			for(var i = 0; i < $matches.size(); i++){
				var $match = $matches.eq(i);
				var visible = matchVisible( $match );
				
				if( visible ){
					return true;
				}
			}
			
			return false;
		}
		
		if( !matchesVisible( $matches ) ){
			$("#side-data").scrollTo( $matches, speed );
		}
		
		
	};
	
	ui.unhighlight_match = function(match){
		match = match.toLowerCase();
		
		show( $("#side-data").find(".ui-textselect-match") );
		show( $("#side-data").find(".ui-textselect-text") );
		show( $("#side-data").find(".sentence-type-button") );
		show( $("#side-data").find(".sentence-expand-button") );
		
	};
	
})();

ui.unhighlight_match_node = function(match){
	cy.nodes().removeClass("highlighted");
	cy.elements().removeClass("unhighlighted");
};

ui.highlight_match_node = function(match){
	var node = match;
	
	if( typeof match == typeof "" ){
		node = cy.nodes("[match @= '"+ match +"']");
	}
	
	cy.elements().not(node).addClass("unhighlighted");
	node.removeClass("unhighlighted").addClass("highlighted");
};

ui.open_match_node = function(match){
	var node = match;
	
	if( typeof match == typeof "" ){
		node = cy.nodes("[match @= '"+ match +"']");
	}
	
	ui.open_node_commandtip(node);
};