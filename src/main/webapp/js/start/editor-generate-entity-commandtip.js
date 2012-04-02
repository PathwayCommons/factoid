ui.generate_entity_commandtip = function(node, tip_div, callback){
	var ret = $('<div></div>');
	var data = node.data();
	var brandNew = node.hasClass("brand-new");
	
	function add_comment(field){	
		
		if( field == null || field == "" ){
			return;
		}
		
		var fields = [];
		var f = field + "";
		for(;;){
			
			var match = f.match(/(([A-Z]+[A-Z\s]*[A-Z]+):(.+?))[A-Z]+[A-Z\s]*[A-Z]+:|$/);
//			console.log(match);
			
			if( match == null || match[0] == "" ){
				break;
			}
			
			var nameAndValue = match[1];
			var name = match[2];
			var value = match[3];
			
			fields.push({
				name: name,
				value: value
			});
			
			f = f.substring( nameAndValue.length );
		}
		
		$.each(fields, function(i, fld){
			var name = fld.name;
			var value = fld.value;
			
			if( name.match(/WEB RESOURCE/i) ){
				
				var link_name = value.match(/Name\=(.+?)\;/)[1];
				var url = value.match(/URL\=\'(.+?)\';/)[1];
				
				add_field(name, '<a href="' + url + '" target="_blank">' + link_name + '</a>');
			} else {
				add_field(name, value);
			}

		});
		
	}
	
	function add_field(name, field, format){
		
		if( field == null || field == "" ){
			return;
		}
		
		var class_name = "node-field gene-field-" + name.toLowerCase().replace(/ /gi, "-");
		
		var field_div = $('<div class="' + class_name + '"></div>');
		ret.append(field_div);
		field_div.append('<strong>' + name + '</strong>:  ');
		
		if( format != null ){
			if( format.chemicalFormula ){
				field = field.replace(/(\d+)/gi, "<sub>$1</sub>");
			} 
			
			if( format.sequence ){
				field = field.replace(/(.)/gi, "<span>$1</span> ");
			} 
		}
		
		if( $.isArray(field) ){
			$.each(field, function(i, f){
				field_div.append( f + (i == field.length - 1 ? '' : ';') );
			});
		} else {
			field_div.append(field);
		}
	}
	
	function add_biopax(biopax_xml, name, type){
		add_biopax_level_3(biopax_xml, name, type);
	}
	
	function add_biopax_level_3(biopax_xml, name, type){
		var biopax = biopax_xml;
		
		var entity = $(biopax).find("bp\\:" + type);

		var bp = {
			entityReference: {
				displayName: entity.find("bp\\:displayName").text(),
				standardName: entity.find("bp\\:standardName").text(),
				organism: {
					displayName: $(biopax).find("bp\\:organism bp\\:name").text(),
					id: $(biopax).find("bp\\:organism bp\\:taxon-xref bp\\:id").text()
				},
				comment: $(biopax).find("bp\\:comment").text().replace(/\"/gi, "'")
			}
		};
		
		bp.entityReference.name = [];
		entity.find("bp\\:name").each(function(){
			bp.entityReference.name.push( $(this).text() );
		});

		node.data({
			"type": type.substring(0, type.length - "reference".length),
			"biopax": bp
		}).removeClass("brand-new");
	}
	
	// depreciated; needs to be fixed if used later
	function add_biopax_level_2(biopax_xml, name){
		var biopax = biopax_xml;
		
		var entity = $(biopax).find("owl\\:Ontology").siblings();

		var bp_name = entity.children("bp\\:name").text();
		
		var bp = {
			entityReference: {
				displayName: name,
				organism: {
					displayName: $(biopax).find("bp\\:organism bp\\:name").text(),
					id: $(biopax).find("bp\\:organism bp\\:taxon-xref bp\\:id").text()
				},
				comment: $(biopax).find("bp\\:comment").text().replace(/\"/gi, "'")
			}
		};
		
		bp.entityReference.name = [];
		$(biopax).find("bp\\:synonyms").each(function(){
			bp.entityReference.name.push( $(this).text() );
		});

		node.data.brandNew = false;
		node.data.type = $(biopax).find("owl\\:Ontology").siblings().get(0).tagName.substring(3).toUpperCase();

		util.biopax(node, bp);
		vis.updateData([ node ]);
	}
	
	function display_biopax(){
		var biopax = node.data("biopax");
		var ref = biopax.entityReference;
		var name = util.name(node);
		
		ret.empty();
		add_field("Standard name", ref.displayName);
		
		if( ref == null ){
			return;
		}
		
		add_field("Synonyms", ref.name);
		
		if( ref.organism != null ){
			add_field("Organism", ref.organism.displayName);
		}
		
		add_field("Sequence", ref.sequence, { sequence: true });
		
		add_field("Chemical formula", ref.chemicalFormula, { chemicalFormula: true });
		
		add_field("Molecular weight", ref.molecularWeight);
		
		if( ref.structure != null ){
			add_field("Structure", ref.structure.structureData);
			add_field("Structure format", ref.structure.structureFormat);
		}
		
		add_comment(ref.comment);
		
		$(tip_div).menucommandtip("tooltip").removeClass("brand-new");
		$(tip_div).menucommandtip("title", name);
	}
	
	if( brandNew ){
		
		// create the match selection ui
		
		var result_count = 0;
		function show_search_results( name, ret, callback ){
			
			var biopaxClass = [];
			$.each(NodeType.entities, function(i, entity){
				biopaxClass.push( entity.val + "Reference" );
			});
			
			var current_count = ++result_count;
			result_count = current_count;
			$.pathwaycommons.match({
				biopaxClass: biopaxClass,
				search: name, 
				error: function(data){
					ret.empty();
					ret.append('<div class="no-results-message ui-state-highlight">We could not connect to Pathway Commons.  Please try again later.</div>');
					$(tip_div).menucommandtip("reposition");
				},
				ready: function(data){

					if( current_count != result_count ){
						return;
					}
					
					ret.empty();
					
					var have_results = data.length > 0;	
					
					if( have_results ){
						//ret.append('<div class="refine-message">Please select a match.</div>');
					} else {
						ret.append('<div class="no-results-message ui-state-highlight">No matches were found from Pathway Commons.  Please try making your search less specific.</div>');
						$(tip_div).menucommandtip("reposition");
					}
					
					var matches = data;
					$.each(matches, function(i, match){
						
						var type = NodeType.fromVal( match.biopaxClass.toLowerCase().match(/(.+)reference/)[1] );
						var names = match.name;
						
						var button = $('<button class="match-selection"></button>');
						ret.append(button);
						button.append(match.name[ match.name.length - 1 ]);
						button.append('<span class="type">' + type.name() + '</span>');
						
						var organism = $('<span class="organism"></span>');
						button.append(organism);
						$.each(match.organismName, function(i, name){
							organism.append(name.toLowerCase() + (i < match.organismName.length - 1 ? ", " : ""));
						});
						
						if( match.name.length > 1 ){
							var names = $('<span class="names"></span>');
							button.append(names);
							
							names.append( $.i18n("pcsearch.aka") + " " );
							
							for(var i = 0; i < match.name.length - 1; i++){
								names.append( match.name[i] + (i != match.name.length - 1 ? "" : ", ") );
							}
						}
						
						button.button().bind("click", function(){
							$.pathwaycommons.biopax({ 	
								uri: match.uri,
								ready: function(biopax){
									var brandNew = node.hasClass("brand-new");
									
									add_biopax(biopax, name, match.biopaxClass.toLowerCase());
									
									display_biopax();
									$(tip_div).menucommandtip("tooltip").find(".ui-tooltip-content").scrollTop(0);
									
									var m = ("" + node.data("match")).toLowerCase();
									$("#side").find("[match = '"+ m +"']").addClass("not-brand-new");
									
									ui.update_entity_counts();
									
								},
								error: function(error){
									$.console.error("Could not load Pathway Commons because of error %o", error);
									// TODO handle error
								}
							});
						});	
					});
				
					if( callback != null ){
						callback(ret);
						$(tip_div).menucommandtip("reposition");
					}
					
					$(tip_div).menucommandtip("reposition");
				}
			});
		}
		
		var search_area = $('<div class="search-area"></div>');
		ret.append(search_area);
		
		var search_title = $('<div class="search-title">Search for the entity</div>');
		search_area.append(search_title);
		
		var input = $('<input class="search-box" type="text" />');
		search_area.append(input);
		
		var results = $('<div class="search-results"></div>');
		ret.append(results);
		
		var prev = "";
		var timeout;
		input.bind("keyup", function(){
			
			var str = input.val();
			if( prev == str ){
				return;
			}
			prev = str;
			
			node.data("typed", str);
			clearTimeout(timeout);
			
			if( results.find(".loading-message").size() == 0 ){
				results.empty().append('<div class="loading-message"><h3>Loading</h3> <small>from Pathway Commons</small> </div> <div class="loading-icon"></div>');
				$(tip_div).menucommandtip("reposition");
			}
			
			timeout = setTimeout(function(){
				show_search_results( str, results );
				$(tip_div).menucommandtip("reposition");
			}, 500);
		});

		if( data.match != null ){
			input.val(data.match);
			input.trigger("keyup");
		}
		
		if( data.typed != null ){
			input.val(data.typed);
			input.trigger("keyup");
		}
		
		callback(ret);
		input.focus();
		$(tip_div).menucommandtip("reposition");
	
	} else {

		// show the biopax data
		display_biopax();
		callback(ret);
		$(tip_div).menucommandtip("reposition");
		
	}
	

};