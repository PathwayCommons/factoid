$(function(){
	
	// don't use script unless the editor exists
	if( !util.in_editor() ){
		return;
	}
	
	// things to load before doing anything else (e.g. drawing the graph)
	var payloads = [ "types", "normalization", "cytoscapeweb" ];
	var loaded_payloads = {};
	$.each(payloads, function(i, payload){
		loaded_payloads[payload] = false;
	});
	
	function loaded_all_payloads(){
		var ret = true;
		
		$.each(payloads, function(i, payload){
			if(!loaded_payloads[payload]){
				ret = false;
			}
		});
		
		return ret;
	}
	
	function loaded(payload){
		
		if( loaded_payloads[payload] ){
			return; // ignore if we've already loaded it
		}
		
		loaded_payloads[payload] = true;

		if( loaded_all_payloads() ){
			load_graph();
		}
	}
	
	// load node type data from the server before
	// loading any more ui dependent on it
	$.ajax({
		type: "GET",
		url: util.absolute_url("json/types"),
		success: function(struct){
			$.each(struct.typesByName, function(name, type){
				NodeType[name] = type;
				NodeType[name].name = function(){
					return $.i18n( "type." + this.val );
				}
			});
			
			NodeType.entities = struct.entities;
			NodeType.interactions = struct.interactions;
			NodeType.controls = struct.controls;
			
			loaded("types");
		}
	});
	
	$.ajax({
		type: "GET",
		url: util.absolute_url("json/normalization/get/" + util.paper_id()),
		success: function(normalization){
			ui.generate_normalization(normalization);
			
			loaded("normalization");
		}
	});
	
	$("#vis").cytoscapeweb(function(){
		window.cy = this;
		loaded("cytoscapeweb");
	});
	
	function load_graph(){
		
		if( util.is_new_paper() ){
			ui.load_network();			
		} else {
		
			$.ajax({
				type: "GET",
				contentType: "application/json",
				url: util.absolute_url("json/cytoweb/get/" + util.paper_id()),
				success: function(json){
					ui.load_network(json);
				}
			});
		}
	}
});