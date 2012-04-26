$(function(){
	
	$.operation.add({
		id: "delete",
		
		message: function(options){
			var els = options.elements.nodes();
			
			if( els.size() == 0 ){
				els = options.elements;
			}

			if( els.size() == 1 ){
				return '' + util.name( els.eq(0) ) + ' has been deleted';
			} else {
				return '' + util.name( els.eq(0) ) + ' and ' + (els.size() - 1) + ' other elements have been deleted';
			}
		},
		
		exec: function(options){
			var eles = options.elements;
			
			function remove_tooltips(){
				eles.nodes().each(function(i, node){

					var tip_div = $(".tip[node=" + node.data("id") + "]");
					if( tip_div.size() > 0 ){
						tip_div.menucommandtip("close");
					}
					
				});
			}
			
			function remove_matches(){
				options.matchesAsSpans = [];
				
				if( options.spans != null ){
					var $spans = $(options.spans);
					options.matchesAsSpans.push( $spans );
				}
				
				eles.nodes().each(function(i, node){
					var matchStr = (node.data("match") || "").toLowerCase();
					var $matches = $("#side .ui-textselect-match[match='"+ matchStr +"']");
					
					$matches.each(function(){
						var $match = $(this);
						var $spans = $match.children();
						
						options.matchesAsSpans.push( $spans );
					});			
					
					$matches.textselect("silentremove");
				});
			}
			
			function remove(){
				var neighbors = eles.neighborhood().nodes().not(eles);
				options.edges = eles.neighborhood().edges();
				
				remove_tooltips();
				remove_matches();
				
				eles.remove();
				//ui.update_commandtips( neighbors );
			}
			
			remove();
			
			ui.update_entity_counts();
			ui.update_empty_sentences();
		},
		
		undo: function(options){
			// restore elements
			options.elements.restore();
			options.edges.restore();
			
			// restore matches
			$.each(options.matchesAsSpans, function(i, $spans){
				$spans.textselect("silentadd");
			});
			
			options.elements.nodes().each(function(){
				var node = this;
				var match = ("" + node.data("match")).toLowerCase();
				
				if( !node.hasClass("brand-new") ){
					$("#side").find(".ui-textselect-match[match='"+ match +"']").addClass("not-brand-new");
				}
			});
			
			ui.update_entity_counts();
			ui.update_empty_sentences();
		}
	});
	
});