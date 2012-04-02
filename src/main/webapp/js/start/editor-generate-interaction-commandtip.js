ui.generate_interaction_commandtip = function(node, tip_div, callback){
	var ret = $('<div></div>');
	
	ret.append('TODO revise these based on new draw-line edge UI.');
	
	callback(ret);
	return;
	
	
	// TODO revise for new UI
	
	
	
	
	var type = NodeType.fromVal(node.data.type);
	
	/////////////////////////////////////////////////////
	// type
	/////////////////////////////////////////////////////
//	ret.append('<h3>' + type.val + '</h3>');
	
	/////////////////////////////////////////////////////
	// title (i.e. settable name)
	/////////////////////////////////////////////////////
	
	var title = $('<input type="text" value="' + util.name(node) + '"/>');	
	ret.append('<div class="subtitle">Name</div>');
	ret.append(title);
	
	var timeout;
	title.bind("keyup", function(){
		clearTimeout(timeout);
		
		var val = $(this).val();
		tip_div.menucommandtip("title", val == "" ? "&nbsp;" : val );
		
		timeout = setTimeout(function(){
			var biopax = util.biopax(node);
			biopax.displayName = val;
			util.biopax(node, biopax);
			vis.updateData([ node ]);
			
			var neighbors = vis.firstNeighbors([ node ]).neighbors;
			ui.update_commandtips(neighbors);
		}, 500);
	});
	
	
	
	
	
	function add_to_table(table, n, e){
		
		var tr = $('<tr></tr>');
		table.find("tbody").append(tr);
		
		/////////////////////////////////////////////////////
		// name of participant
		/////////////////////////////////////////////////////
		
		tr.append('<td class="name">' + util.name(n) + '</td>');
		
		var other_n_id = util.other_id_in_edge(e, node.data.id);
		
		if( type.val == NodeType.CONVERSION.val ||	type.val == NodeType.TEMPLATE_REACTION.val ){
			
			/////////////////////////////////////////////////////
			// coefficient
			/////////////////////////////////////////////////////
			
			var coeff_td = $('<td class="coefficient"></td>');
			
			var coeff = $('<input type="text" value="' + e.data.coefficient + '" />');
			
			function val(){
				var val = parseFloat( coeff.val() );
				var valid  = false;
				
				if( !isNaN(val) && val % 1 == 0 && val > 0 ){
					valid = true;
				}
				
				return { value: val, valid: valid };
			}
			
			var plus_coeff = $('<button class="coefficient-plus-button"></button>');
			var minus_coeff = $('<button class="coefficient-minus-button"></button>');
			
			var button_timeout;
			var button_value;
			
			function trigger_button_timeout(){
				clearTimeout(button_timeout);
				button_timeout = setTimeout(function(){
					button_value = null;
					coeff.trigger("validate");
				}, 250);
			}
			
			function last_button_value(delta){
				if( button_value == null ){
					button_value = last_valid_val;
				}
				
				button_value += delta;
				
				return button_value;
			}
			
			plus_coeff.button({
				icons: {
					primary: "ui-icon-triangle-1-n"
				},
				text: false,
				label: ""
			}).click(function(){
				coeff.val( last_button_value(1) );	
				trigger_button_timeout();
			});
			
			minus_coeff.button({
				icons: {
					primary: "ui-icon-triangle-1-s"
				},
				text: false,
				label: ""
			}).click(function(){
				
				if( last_button_value(0) == 1 ){
					return;
				}
				
				coeff.val( last_button_value(-1) );
				trigger_button_timeout();
			});
			
			coeff_td.append(plus_coeff);
			coeff_td.append(minus_coeff);
			coeff_td.append(coeff);
			
			var timeout;
			var last_valid_val = e.data.coefficient;
			coeff.bind("validate", function(){
				var v = val();
				
				if( v.valid && v.value != last_valid_val ){
					last_valid_val = v.value;
					e.data.coefficient = v.value;
					vis.updateData([ e ]);
				}
			}).bind("blur", function(){
				var v = val();
				
				if( !v.valid ){
					coeff.val(last_valid_val);
				}
			}).bind("change keyup", function(){
				clearTimeout(timeout);
				timeout = setTimeout(function(){
					coeff.trigger("validate");
				}, 150);
			});
			
			tr.append(coeff_td);
			
		}
		
		if( type.val == NodeType.CONVERSION.val ){
		
			/////////////////////////////////////////////////////
			// left / right selection
			/////////////////////////////////////////////////////
			
			var lr_td = $('<td class="lr"></td>');
			
			var name = 'lr-select-' + n.data.id + '-' + e.data.id;
			var l_id = name + '-left';
			var r_id = name + '-right';
			
			var lr_buttonset = $('<div></div>');
			var prev_checked;
			
			var l = $('<input type="radio" id="' + l_id + '" name="' + name + '" />');
			lr_buttonset.append(l);
			lr_buttonset.append('<label for="' + l_id + '">L</label>');
			
			l.click(function(){
			
				if( prev_checked == l ){
					return;
				}
				prev_checked = l;
				
				ui.delete_edge(e);
				
				e.data.source = other_n_id;
				e.data.target = e.data.interaction;

				ui.add_edge(e.data);
			});
			
			var r = $('<input type="radio" id="' + r_id + '" name="' + name + '" />');
			lr_buttonset.append(r);
			lr_buttonset.append('<label for="' + r_id + '">R</label>');
			
			r.click(function(){
				
				if( prev_checked == r ){
					return;
				}
				prev_checked = r;
				
				ui.delete_edge(e);
				
				e.data.source = e.data.interaction;
				e.data.target = other_n_id;
				
				ui.add_edge(e.data);
			});
			
			if( e.data.target == e.data.interaction ){
				l.attr("checked", "checked");
				prev_checked = l;
			} else {
				r.attr("checked", "checked");
				prev_checked = r;
			}
			
			lr_buttonset.buttonset();
			
			lr_td.append(lr_buttonset);
			tr.append(lr_td);			
		}
		
		/////////////////////////////////////////////////////
		// delete button
		/////////////////////////////////////////////////////
		
		var remove_td = $('<td class="delete"></td>');
		var remove = $('<button class="delete-button"></button>');
		remove.button({
			icons: {
				primary: "ui-icon-closethick"
			},
			text: false,
			label: ""
		}).click(function(){
			ui.delete_edge(e);
		});
		remove_td.append(remove);
		tr.append(remove_td);
	}
	
	function add_table(edges, title){
		var partipants_table = $('<table class="participants"><tbody></tbody></table>');
		
		// add each participant to the table
		var added_header = false;
		$.sortedEach(edges, function(i, edge){
			if( edge.data.interaction == node.data.id ){
				
				if( !added_header ){
					ret.append('<div class="subtitle">'+ title +'</div>');
					ret.append(partipants_table);
					added_header = true;
				}
				
				var connected_to_edge = vis.node( edge.data.source != edge.data.interaction ? edge.data.source : edge.data.target );
				add_to_table(partipants_table, connected_to_edge, edge);
			}
		}, function(e1, e2){
			var n1 = util.name( util.other_id_in_edge(e1, node.data.id) );
			var n2 = util.name( util.other_id_in_edge(e2, node.data.id) );
			
			if( n1 < n2 ){
				return -1;
			} else if( n1 == n2 ){
				return 0;
			} else {
				return 1;
			}
		});
	}
	
	var edges = vis.firstNeighbors([ node ]).edges;
	if( node.data.type == NodeType.PATHWAY.val ){
		add_table(edges, "First step");
	} else if( node.data.type == NodeType.PATHWAY_STEP.val ){
		
		var next_step = [];
		var interaction = [];
		
		$.each(edges, function(i, edge){
			if( edge.data.type == NodeType.PATHWAY.val ){
				next_step.push(edge);
			} else if( edge.data.type == NodeType.PATHWAY_STEP.val ) {
				interaction.push(edge);
			}
		});
		
		add_table(next_step, "Next step");
		add_table(interaction, "Interaction");
	} else {
		add_table(edges, "Participants");
	}
	
	
	callback(ret);
	$(tip_div).menucommandtip("reposition");

};		