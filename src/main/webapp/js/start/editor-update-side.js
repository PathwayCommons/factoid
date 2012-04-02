ui.update_entity_counts = function(){
	
	var complete = cy.nodes(".entity").not(".brand-new").size();
	var incomplete = cy.nodes(".entity.brand-new").size();
	
	$("#complete-entity-count").html( complete );
	$("#incomplete-entity-count").html( incomplete );
	
};

ui.update_empty_sentences = function(){
	
	$("#side-data .sentence").each(function(){
		var $sentence = $(this);
		
		if( $sentence.find(".ui-textselect-match").size() > 0 ){
			$sentence.removeClass("no-matches").removeClass("expanded");
		} else {
			$sentence.addClass("no-matches");
		}
	});
	
};