ui.get_node_commands = function(node){
	var type = NodeType.fromVal( node.data("type") );
	var commands = {};
	var ret = [];
	
	function add(command){
		ret.push(command);
	}
	
	commands.select_type = function(type, options){
		return $.extend( true, {}, {
			name: type.name().capitalize(),
			select: function(){
				if( options == null || options.items == null ){
					$.log("Setting new interaction node as type %s", type.val);
					
					node.data("type", type.val);
					node.data("brandNew", false);
					
					ui.open_node_commandtip(node);
				}
			}, 
			menuClose: options == null || options.items == null
		}, options);
		
	};
	
	commands.add_edge = function(options){
		var ret = $.extend( true, {}, {
			name: "Connect to participant",
			menuClose: true,
			edge: {
				bidirectional: false,
				directed: false,
				type: type.val
			},
			options: {
				towardsSelected: true,
				selectedMustBeInteraction: true	
			}
		}, options);
		
		ret.select = function(){
			UiState.enter(UiState.ADD_EDGE, { interaction: node, edge_data: ret.edge, options: ret.options });
		};
		
		return ret;
	};
	
	commands.delete_self = function(options){ 
		return $.extend( true, {}, {
			name: "Delete",
			items: options.confirm != true ? null : [
				{
					name: "No, don't delete this"
				},
		        {
		        	name: "Yes, delete this",
		        	select: function(){ ui.delete_node(node) },
		        	menuClose: true
		        }
			],
			select: options.confirm != true ? function(){ ui.delete_node(node) } : null,
			menuClose: options.confirm != true
		}, options);
	};

	if(type.interaction) {
	
		// refine type
		//////////////
		
		var refine = {
			name: "Set interaction type",
			items: []
		};
		
		add(refine);
		function refadd(item){
			refine.items.push(item);
		}
		
		refadd( commands.select_type(NodeType.CONTROL, {
			items: [
			    commands.select_type(NodeType.CONTROL, {
			    	name: "Generic control"
			    }),
				commands.select_type(NodeType.CATALYSIS),
				commands.select_type(NodeType.MODULATION)
			],
			newSection: true
		}) );
		
		refadd( commands.select_type(NodeType.CONVERSION) );
		
		refadd( commands.select_type(NodeType.GENETIC_INTERACTION) );
		
		refadd( commands.select_type(NodeType.MOLECULAR_INTERACTION) );

		refadd( commands.select_type(NodeType.TEMPLATE_REACTION) );
		
		refadd( commands.select_type(NodeType.PATHWAY, {
			newSection: true
		}) );
		
		refadd( commands.select_type(NodeType.PATHWAY_STEP) );
		
		
		// normal commands
		//////////////////
		
		switch(type.val){
		
		case NodeType.TEMPLATE_REACTION.val:
			
			add( commands.add_edge({
				name: "Set template",
				edge: {
					interaction: node.data.id,
					directed: true,
					coefficient: 1
				},
				options: {
					towardsSelected: false,
					mustSelect: {
						types: [ NodeType.DNA, NodeType.DNA_REGION, NodeType.RNA, NodeType.RNA_REGION ], 
						name: "a nucleic acid" 
					},
					deleteOldEdge: true,
					justNodePairMatches: true
				}
			}) );
			
			add( commands.add_edge({
				name: "Add product",
				edge: {
					interaction: node.data.id,
					directed: true,
					coefficient: 1
				},
				options: {
					towardsSelected: true,
					mustSelectEntity: true,
					deleteOldEdge: true,
					justNodePairMatches: true
				}
			}) );
			
			break;
			
		case NodeType.CONVERSION.val:
			
			add( commands.add_edge({
				name: "Add left participant",
				edge: {
					interaction: node.data.id,
					directed: true,
					coefficient: 1
				},
				options: {
					towardsSelected: false,
					mustSelectEntity: true,
					deleteOldEdge: true,
					justNodePairMatches: true
				}
			}) );
			
			add( commands.add_edge({
				name: "Add right participant",
				edge: {
					interaction: node.data.id,
					directed: true,
					coefficient: 1
				},
				options: {
					towardsSelected: true,
					mustSelectEntity: true,
					deleteOldEdge: true,
					justNodePairMatches: true
				}
			}) );
			
			break;
		
		case NodeType.CATALYSIS.val:
		case NodeType.MODULATION.val:	
		case NodeType.CONTROL.val:
			
			add( commands.add_edge({
				name: "Set controller",
				edge: {
					interaction: node.data.id
				},
				options: {
					deleteOldEdge: true,
					mustSelect: {
						types: $.merge([ NodeType.PATHWAY ], NodeType.entities),
						name: "an entity or a pathway"
					}
				}
			}) );
			
			add( commands.add_edge({
				name: "Set controlled",
				edge: {
					directed: true,
					interaction: node.data.id
				},
				options: {
					towardsSelected: true,
					mustSelectInteraction: true,
					deleteOldEdge: true
				}
			}) );
			
			break;
		
		case NodeType.PATHWAY_STEP.val:
			
			add( commands.add_edge({
				name: "Set interaction",
				edge: {
					interaction: node.data.id
				},
				options: {
					mustSelectInteraction: true,
					deleteOldEdge: true
				}
			}) );
			
			add( commands.add_edge({
				name: "Set next step",
				edge: {
					interaction: node.data.id,
					directed: true,
					type: NodeType.PATHWAY.val
				},
				options: {
					mustSelect: {
						types: [ NodeType.PATHWAY_STEP ],
						name: "a pathway step"
					},
					deleteOldEdge: true
				}
			}) );
			
			break;
		
		case NodeType.PATHWAY.val:
			
			add( commands.add_edge({
				name: "Set first step",
				edge: {
					interaction: node.data.id
				},
				options: {
					mustSelect: {
						types: [ NodeType.PATHWAY_STEP ],
						names: "a pathway step"
					},
					deleteOldEdge: true
				}
			}) );
			
			break;
			
		case NodeType.INTERACTION.val:
		case NodeType.MOLECULAR_INTERACTION.val:
		default:
			
			add( commands.add_edge({
				name: "Add participant",
				edge: {
					interaction: node.data.id
				},
				options: {
					deleteOldEdge: true,
					justNodePairMatches: true
				}
			}) );
			
			break;
		}
	}
	
	add( commands.delete_self({ 
		newSection: true,
		confirm: type.entity || !node.data.brandNew
	}) );
	
	return ret;	
};
