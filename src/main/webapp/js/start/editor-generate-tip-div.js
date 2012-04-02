
(function(){
	function make_tip(node, type){
		var cls = (type != null ? type + "-" : "") + 'tip';
		var id = node.data("id");
		
		// keep tips individual
		// dragged tips for one node don't open a new one on a second click
		// new tooltips open for other nodes
		var tip_div = $('.' + cls + '[node='+ id +']');
		
		if( tip_div.size() == 0 ){
			tip_div = $('<div class="' + cls + '" node="' + id + '"></div>');
			$("body").append(tip_div);
		}
		
		var dims = node.renderedDimensions();
		var pos = node.renderedPosition();
		
		var parent_left = $("#vis").offset().left + parseFloat( $("#vis").css("border-left-width") );
		var parent_top = $("#vis").offset().top;
		
		var size = dims.width;
		var radius = size / 2.0;
		
		var left = pos.x + parent_left;
		var top = pos.y + parent_top;
		
		// put the tip div where the node is
		tip_div.css({
			position: "absolute",
			left: left,
			top: top,
			height: "1px",
			width: "1px"
		});
		
		return tip_div;
	}
	
	ui.generate_node_commandtip_div = function(node){
		return make_tip(node, "command");
	};

	ui.generate_node_messagetip_div = function(node){
		return make_tip(node, "message");
	};
})();

