ui.relayout = function(){
	
	cy.layout({
		name: util.debug() ? "grid" : "arbor",
		gravity: true
	});
	
};