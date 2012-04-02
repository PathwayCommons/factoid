ui.open_node_messagetip = function(node, message){

	var tip_div = ui.generate_node_messagetip_div(node);
	
	$(tip_div).commandtip({
		content: '<span class="ui-icon ui-icon-alert"></span>' + message,
		buttons: [
			{
				text: "Cancel",
				select: function(){
					UiState.leave();
				},
				close: true
			},
			{
				text: "OK",
				close: true
			}
		],
		close: "unfocus",
		classes: "node-message ui-state-highlight",
		adjust: {
			x: 0,
			y: node.size / 2 * vis.zoom()
		}
	});
	
	$(tip_div).commandtip("tooltip").removeClass("ui-tooltip-focus");
};
