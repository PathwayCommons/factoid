$(function(){
	
	// don't use script unless the editor exists
	if( !util.in_editor() ){
		return;
	}

	$("#vis").cytoscapeweb({
		layout: {
//			name: "grid",
			name: "arbor",
			maxSimulationTime: 7000
		},
		ready: function(cy){
			window.cy = cy;
		},
		style: {
			global: {},
			selectors: {
				"node": {
					height: 40,
					width: 40,
					borderWidth: 0,
					fillColor: "#888",
					labelOutlineColor: "#888",
					labelValign: "middle",
					labelHalign: "middle",
					labelFontSize: "0.85em",
					labelFillColor: "#fff",
					labelOutlineWidth: 3,
					labelText: {
						customMapper: function(data){
							var type = NodeType.fromVal(data.type);
							
							if( type != null && type.entity ){
								return util.name(data.id);
							} else {
								return "";
							}
						}
					}
				},
				"edge": {
					width: 1.5
				},
				"node[type='Interaction']": {
					fillColor: "#f1b7ca",
					shape: "rectangle",
					height: 15,
					width: 15
				},
				"edge[type='Interaction']": {
					lineColor: "#f1b7ca"
				},
				"node:selected": {
					borderWidth: 3,
					borderColor: "#F9AD1C"
				},
				".highlighted": {
					
				},
				".unhighlighted": {
					opacity: 0.25
				},
				"node.brand-new": {
					labelOutlineColor: "#555",
					fillColor: "#555"
				},
				
				"node.ui-cytoscapeweb-edgehandles-hover": {
					
				},
				
				"node.ui-cytoscapeweb-edgehandles-target": {
					borderColor: "#d18aa1",
					borderWidth: 3,
					borderOpacity: 0.75
				},
				
				".ui-cytoscapeweb-edgehandles-preview": {
					fillColor: "#d18aa1",
					lineColor: "#d18aa1",
					sourceArrowColor: "#d18aa1",
					targetArrowColor: "#d18aa1",
					opacity: 0.75,
					labelText: "",
					style: "dash"
				}
			}
		}
	});
	
	return;
	
	vis_style = {
		edges: {
			color: { 
				defaultValue: "#aaaaaa",
				customMapper: { functionName: "colorMapper" }
			},
			label: {
				customMapper: { functionName: "edgeLabelMapper" }
			},
			width: 2,
			opacity: 1,
			style: {
				defaultValue: "SOLID",
				customMapper: { functionName: "styleMapper" }
			},
			targetArrowShape: {
				defaultValue: "NONE",
				customMapper: { functionName: "targetArrowShapeMapper" }
			},
			sourceArrowShape: {
				defaultValue: "NONE",
				customMapper: { functionName: "sourceArrowShapeMapper" }
			},
			selectionGlowColor: "#000000",
			selectionGlowOpacity: 0,
			selectionGlowBlur: 0,
			labelFontSize: 14,
			labelFontColor: "#ffffff",
			labelFontWeight: "bold",
			labelGlowColor: { 
				defaultValue: "#aaaaaa",
				customMapper: { functionName: "edgeLabelGlowColorMapper" }
			},
			labelGlowOpacity: 1.0,
			labelGlowBlur: 4,
			labelGlowStrength: 32
		},
		nodes: {
			label: {
				customMapper: { functionName: "nodeLabelMapper" }
			},
			size: {
				customMapper: { functionName: "sizeMapper" }
			},
			color: { 
				defaultValue: "#808080",
				customMapper: { functionName: "colorMapper" }
			},
			shape: {
				defaultValue: "elipse",
				customMapper: { functionName: "shapeMapper" }
			},
			borderColor: { 
				defaultValue: "#808080",
				customMapper: { functionName: "borderColorMapper" }
			},
			borderWidth: 1,
			opacity: {
				defaultValue: 1,
				customMapper: { functionName: "opacityMapper" }
			},
			image: {
				customMapper: { functionName: "imageMapper" }
			},
			selectionOpacity: 1.0,
			selectionBorderWidth: 3,
			selectionGlowOpacity: 0,
			selectionBorderColor: "#000000",
			highlightBorderColor: "#aed1e5",
			highlightColor: "#aed1e5",
			highlightLabelGlowColor: "#aed1e5",
			labelFontSize: 11,
			labelFontColor: "#ffffff",
			labelFontWeight: "bold",
			labelGlowColor: "#808080",
			labelGlowOpacity: 1.0,
			labelGlowBlur: 6,
			labelGlowStrength: 32,
			selectionLabelGlowColor: "#000000"
		},
		global: {
			selectionFillColor: "#aaaaaa",
			selectionLineColor: "#333333",
			selectionFillOpacity: 0.25,
			selectionLineOpacity: 0.5,
			selectionLineWidth: 1
		}
	};

	layout_options = {
		name: "forcedirected"
	};
	
	vis_options = {
		swfPath: util.absolute_url("swf/CytoscapeWeb_0.7.3-prerelease"),
		flashInstallerPath: util.absolute_url("swf/playerProductInstall"),
		flashAlternateContent: '<p>Factoid requires the Adobe Flash.</p>' +
		                       '<p><a href="http://get.adobe.com/flashplayer/"><img width="160" height="41" border="0" alt="Get Adobe Flash Player" src="http://www.adobe.com/macromedia/style_guide/images/160x41_Get_Flash_Player.jpg"></a></p></div>',
		visualStyle: vis_style,
		layout: layout_options,
		nodeLabelsVisible: true,
		edgeLabelsVisible: true,
		panZoomControlVisible: false
	};

	var listeners = {};
	
	function get_listener(evt, gr, fn){
		try{
			return listeners[evt][gr][fn];
		} catch(e){
			return null;
		}
	}
	
	function add_listener(evt, gr, fn, wrapped){
		if( listeners[evt] == null ){
			listeners[evt] = {};
		}
		
		if( gr == undefined || gr == null ){
			gr = "none";
		}
		
		if( listeners[evt][gr] == null ){
			listeners[evt][gr] = {};
		}
		
		if( wrapped == null ){
			listeners[evt][gr][fn] = false;
		} else {
			listeners[evt][gr][fn] = wrapped;
		}
	}
	
	function remove_listener(evt, gr, fn){
		try{
			
			if( gr == null || gr == undefined ){
				gr = "none";
			}
			
			delete listeners[evt][gr][fn];
		} catch(e){
			
		}
	}
	
	vis = new org.cytoscapeweb.Visualization("vis", vis_options);

	vis.unbind = function(evt, gr, fn){
		if( fn == null ){
			fn = gr;
			gr = undefined;
		}
		
		var wrapped = get_listener(evt, gr, fn);
		if( !wrapped ){
			wrapped = fn;
		}
		
		remove_listener(evt, gr, fn);
		vis.removeListener(evt, gr, wrapped);
	};
	
	vis.bind = function(evt, gr, fn){
		
		if( fn == null ){
			fn = gr;
			gr = undefined;
		}
		
		add_listener(evt, gr, fn);
		vis.addListener(evt, gr, fn);
	};
	
	vis.one = function(evt, gr, fn){
		
		if( fn == null ){
			fn = gr;
			gr = undefined;
		}
		
		var listener = function(e){
			remove_listener(evt, gr, fn);
			vis.removeListener(evt, gr, listener);
			fn(e);
		};
		
		add_listener(evt, gr, fn, listener);
		vis.addListener(evt, gr, listener);
	};
	
	vis["_drawn_fns"] = [];

	vis["drawn"] = function(fn){
		vis["_drawn_fns"].push(fn);	
	};

	vis.ready(function(){
		var fns = vis["_drawn_fns"];
		while(fns.length > 0){
			var fn = fns.shift();
			fn();
		}
	});

	vis["sourceArrowShapeMapper"] = function(data){
		if( data.bidirectional ){
//			return "DELTA";
		}
		
		return "NONE";
	};
	
	vis["targetArrowShapeMapper"] = function(data){
		var type = NodeType.fromVal(data.type);

		if( !data.directed ){
			return "NONE";
		} else if( type.val == NodeType.MODULATION.val ){
			return "DIAMOND";
		} else if( type.val == NodeType.CATALYSIS.val ){
			return "CIRCLE";
		}
		
		return "DELTA";
	};
	
	vis["imageMapper"] = function(data){
		var type = NodeType.fromVal(data.type);
		
		if( type.entity ){
			return util.absolute_url("img/bg/node_transparent_010.png");
		} else {
			//return util.absolute_url("img/bg/node_transparent_005.png");
		}
	};
	
	vis["styleMapper"] = function(data){
		var type = NodeType.fromVal(data.type);
		
		if( type.val == NodeType.PATHWAY_STEP.val ){
			return "DOT";
		} else {
			return "SOLID";
		}
	};
	
	vis["colorMapper"] = function(data){
		
		switch(data.type){
		case NodeType.INTERACTION.val:
			return "#f1b7ca";
		case NodeType.PATHWAY.val:
		case NodeType.PATHWAY_STEP.val:
			return "#e88989";
		case NodeType.CONTROL.val:
		case NodeType.CATALYSIS.val:
		case NodeType.MODULATION.val:
			return "#c2c9f4";
		case NodeType.GENETIC_INTERACTION.val:
			return "#baecea";
		case NodeType.TEMPLATE_REACTION.val:
			return "#b2ecb4";
		case NodeType.MOLECULAR_INTERACTION.val:
			return "#f9f289";
		case NodeType.CONVERSION.val:
			return "#d5a5d9";
		
		default:
			return null;
		}
	};
	
	vis["edgeLabelGlowColorMapper"] = function(data){
		var type = NodeType.fromVal(data.type);
		var color;
		
		if( type.interaction ){
			color = vis.colorMapper(data);
		} else {
			color = vis_style.edges.color.defaultValue;
		}
		
		return $.Color(color).toHSL().adjust( [0, 0, -0.05] ).toString();
	};
	
	vis["borderColorMapper"] = function(data){
		var type = NodeType.fromVal(data.type);
		var color;
		
		if( type.interaction ){
			color = vis.colorMapper(data);
		} else {
			color = vis_style.nodes.color.defaultValue;
		}
		
		return $.Color(color).toHSL().adjust( [0, 0, -0.05] ).toString();
	};

	vis["sizeMapper"] = function(data){
		var type = NodeType.fromVal(data.type);
		
		if( type.interaction ){
			if( type.val == NodeType.PATHWAY_STEP.val ){
				return 10;
			} else {
				return 15;
			}
		} else {
			if( type.val == NodeType.COMPLEX.val ){
				return 75;
			} else {
				return 50;
			}
		}
	};

	vis["shapeMapper"] = function(data){
		
		var val = NodeType.fromVal(data.type);
		if( val.interaction ){
			return "rectangle";
		} else {
			return "ellipse"; //val.shape;
		}
	};

	vis["borderWidthMapper"] = function(data){
		return 1;
	};
	
	vis["opacityMapper"] = function(data){
		return 1;
		return NodeType.fromVal(data.type).entity ? 1 : 0.85;
	};
	
	vis["nodeLabelMapper"] = function(data){
		var type = NodeType.fromVal(data.type);
		
		if( type.entity ){
			return util.name(data.id);
		} else {
			return "";
		}
	};
	
	vis["edgeLabelMapper"] = function(data){
		
		if( data.coefficient != null ){
			return "" + data.coefficient;
		}
		
		return "";
	};
});
