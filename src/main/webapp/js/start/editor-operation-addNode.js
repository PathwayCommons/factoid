$(function(){
	$.operation.add({
		id: "addNode",
		
		defaults: {
			data: {
				label: "New entity",
				type: "Entity"
			},
			classes: "entity",
			group: "nodes",
			renderedPosition: {
				x: 75,
				y: 75
			},
			step: 100,
			closeDistance: 50,
			openTip: true
		},
		
		message: function(options){
			var type = NodeType.fromVal( options.data.type );
			var name = "A new " + (type.entity ? "entity" : "interaction");
			
			if( options.match != null ){
				name = $(options.match).attr("match");
			}
			
			return name + " has been added.";
		},
		
		exec: function(options){
			var type = NodeType.fromVal( options.data.type );

			var id = options.data.id != undefined ? options.data.id : util.generate_node_id();
			options.data.id = id;

			var step = options.step;
			var position;
			
			function distance(p1, p2){
				var dx = p2.x - p1.x;
				var dy = p2.y - p1.y;
				
				return Math.sqrt( dx*dx + dy*dy );
			}
			
			function close(p1, p2){
				if( distance(p1, p2) < options.closeDistance ){
					return true;
				} else {
					return false;
				}
			}
			
			var moved = true;
			var position = $.extend({}, options.renderedPosition);
			
			while( moved ){
				moved = false;
				var z = cy.zoom();
				
				cy.nodes().each(function(){
					var p = this.renderedPosition();
					
					if( close(p, position) ){
						position.x += step * z;
						moved = true;
						
						if( position.x > $("#vis").width() ){
							position.x = options.renderedPosition.x;
							position.y += step * z;
						}
					}
				});
			}

			options.renderedPosition = position;

			cy.add({
				data: options.data,
				group: options.group,
				renderedPosition: options.renderedPosition,
				classes: options.classes + " brand-new"
			});
			var node = cy.nodes("#" + id);
			
			node.bypass({
				borderColor: "#AED1E5",
				borderWidth: 16
			}).animate({
				bypass: {
					borderWidth: 0
				}
			}, {
				duration: 250,
				complete: function(){
					node.removeBypass();
				}
			});
			
			var $match = $(options.match);

			if( options.matchSpans == null ){
				options.matchSpans = $match.children();
			}
			
			// if we've already undone, use the match spans
			if( $match.children().size() == 0 ){ 
				$(options.matchSpans).textselect("silentadd");
			}
			
			ui.update_entity_counts();
			ui.update_empty_sentences();
			
			// TODO find out why we need this hack for the 
			// tooltip not to close right away...
			setTimeout(function(){
				if( options.openTip ){
					ui.open_node_commandtip( node );
				}
			}, 10);
			
		},
		
		undo: function(options){
			cy.filter("#" + options.data.id).remove();
			
			var $match = $(options.match);
			if( options.matchSpans != null ){
				$(options.matchSpans).parent().textselect("silentremove");
			} else {
				$match.textselect("silentremove");
			}
			
			ui.update_entity_counts();
			ui.update_empty_sentences();
		}
	});

});