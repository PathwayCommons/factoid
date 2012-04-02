ui.generate_normalization = function(normalization){
	
	var sentences = normalization.sentences;
	
	var commandtipPosition = {
		my: "top right",
		at: "bottom left",
		adjust: {
			x: 0,
			y: -8
		}
	};
	
	function matches(node, text){
		var match = node.data("match");
		
		return match != null && match.toLowerCase() == text.toLowerCase();
	}
	
	function removeMatchNodes(text, matchSpans){
		var eles = cy.nodes("[match @= '"+ text +"']");
		
		if( eles.size() > 0 ){
			$.operation.exec("delete", {
				elements: eles,
				spans: matchSpans
			});
		}
	}
	
	function addMatchNode(text, matchEle){
		var nodes = cy.nodes("[match @= '"+ text +"']");
		
		if( nodes.size() == 0 ){
			$.operation.exec("addNode", {
				data: {
					match: $(matchEle).text()
				},
				match: matchEle,
				openTip: false
			});
		}
	}
	
	function updateMatchNodes(oldText, newText){
		var nodes = cy.nodes();
		var alreadyHaveIt = false;
		var toUpdate = cy.collection();
		var matchText = $("#side .ui-textselect-match[match='"+ newText +"']").text();
		
		nodes.each(function(i, node){
			if( matches(node, newText) ){
				alreadyHaveIt = true;
			}
		});
		
		if( !alreadyHaveIt ){
			$.each(nodes, function(i, node){
				if( matches(node, oldText) ){
					toUpdate = toUpdate.add(node);
				}
			});
		}
		
		if( toUpdate.size() > 0 ){
			toUpdate.data("match", matchText);
		}
	}
	
	function getMatches(text){
		return $("#side .ui-textselect-match[match='" + text + "']");
	}
	
	if( sentences != null ){
		$.each(sentences, function(i, sentence){
			if( true || sentence.matches != null && sentence.matches.length > 0 ){
				var $sentence = $('<div class="sentence"></div>');
				 $("#side-data").append($sentence);
				
				var $button = $('<button class="sentence-type-button" tipposition="left"><span class="ui-icon ui-icon-triangle-1-s"></span></button>');
				$button.attr("tooltip", "Select the type of interaction this sentence contains.");
				$sentence.append($button);
				$button.button();
				
				var $button_expand = $('<button class="sentence-expand-button" tipposition="left"><span class="ui-icon ui-icon-arrowthick-1-s"></span></button>');
				$button_expand.attr("tooltip", "Toggle whether this sentence with no entities is expanded.");
				$sentence.append($button_expand);
				$button_expand.button();
				
				$button_expand.bind("click", function(){
					if( $sentence.hasClass("expanded") ){
						$sentence.removeClass("expanded");
					} else {
						$sentence.addClass("expanded");
					}
				});
				
				var $expand_overlay = $('<div class="expand-overlay"></div>');
				$sentence.append( $expand_overlay );
				
				$expand_overlay.bind("mouseenter", function(){
					$button_expand.trigger("mouseover");
					$expand_overlay.addClass("ui-state-hover");
				}).bind("mouseleave", function(){
					$button_expand.trigger("mouseout");
					$expand_overlay.removeClass("ui-state-hover");
				}).bind("click", function(){					
					$button_expand.trigger("mouseout");
					$expand_overlay.removeClass("ui-state-hover");
					$button_expand.click();
				});
				
				var canOpen = true;
				$button.bind("click", function(){
					
					if( !canOpen ){
						//return;
					}
					
					$button.menucommandtip({
						title: "Set this sentence as...",
						items: [
						        	{
						        		name: "Some interaction type",
						        		attr: {
						        			tooltip: "Some kind of interaction",
						        			tipposition: "left"
						        		}
						        	},
						        	{ 
						        		name: "Another interaction type",
						        		attr: {
						        			tooltip: "Another kind of interaction",
						        			tipposition: "left"
						        		}
						        	}
						       ]
					});
				}).bind("mousedown", function(){
					if( $button.commandtip("tooltip").size() > 0 ){
						canOpen = false;
					} else {
						canOpen = true;
					}
				});
				
				function updateBrandNewStatus( text, $match ){
					if( !cy.nodes("[match @= '"+ text +"']").hasClass("brand-new") ){
						$match.addClass("not-brand-new");
					} else {
						$match.removeClass("not-brand-new");
					}
				}
				
				$sentence.textselect({
					string: sentence.string,
					matches: sentence.matches,
					add: function(text){
						var $matches = getMatches(text);
						
						if( $matches.size() == 1 ){
							addMatchNode(text, this);
						}
						
						updateBrandNewStatus( text, $(this) );
					},
					remove: function(text, $spans){
						if( getMatches(text).size() == 0 ){
							removeMatchNodes(text, $spans);
						}
					},
					change: function(oldText, newText){
						if( getMatches(oldText).size() == 0 ){
							updateMatchNodes(oldText, newText);
						} else if( getMatches(newText).size() == 1 ){
							addMatchNode(newText, this);
						} 
						
						updateBrandNewStatus( newText, $(this) );
					},
					click: function(){
						return;
						
						var match = $(this).attr("match");
						var node = cy.nodes("[match @= '"+ match +"']");
						
						node.click();
					},
					closeAttributes: {
						tooltip: $.i18n("textmining.delete_icon.tooltip")
					}
				});
				
				if( sentence.matches.length == 0 ){
					$sentence.addClass("no-matches");
				}
			}
		});
	}
	
};
