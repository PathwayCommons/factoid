ui.open_node_commandtip = function(node){
	var type = NodeType.fromVal( node.data("type") );
	var brandNew = node.hasClass("brand-new");
	
	function commands(){
		return ui.get_node_commands(node);
	}
	
	function classes(){
		return ( type.entity ? " entity-tooltip " : "" )
			+ ( type.interaction ? " interaction-tooltip " : "" )
			+ " node-tooltip " 
			+ ( brandNew ? " brand-new " : "not-brand-new" );
		
	}
	
	function title(){
		return util.name(node) == null || util.name(node) == "" ? "&nbsp;" : util.name(node);
	}
	
	function content(){
		return '<div class="node-tooltip-content"> No content set </div>';
	}
	
	var size = node.renderedDimensions().width;
	var radius = size / 2.0;
	
	var options = {
		classes: classes(),
		items: commands(),
		title: title(),
		content: content(),
		menuClose: false,
		draggable: true,
		ready: function(){
			options.generate(function(html){
				$(tip_div).menucommandtip("tooltip").find(".node-tooltip-content").empty().append( html );
			});
		},
		generate: function(callback){
			ui.generate_commandtip(node, tip_div, callback);
		},
		adjust: {
			x: 0,
			y: radius
		},
		deleteButton: true,
		deleteTooltip: $.i18n("commandtip.delete.tooltip"),
		closeOnDelete: true,
		closeTooltip: $.i18n("commandtip.close.tooltip"),
		onDelete: function(){
			$.operation.exec("delete", {
    			elements: node
    		});
		}
	};

	var tip_div = ui.generate_node_commandtip_div(node);
	
	if( true || type.entity ){ // TODO revise this after interactions have been updated with draw logic
		$(tip_div).commandtip(options);
	} else {
		$(tip_div).menucommandtip(options);
	}
	
	$(tip_div).menucommandtip("tooltip").bind("generate", function(){
		options.ready();
	});
};