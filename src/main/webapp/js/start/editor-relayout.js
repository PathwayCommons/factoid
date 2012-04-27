ui.relayout = function(){
	
	cy.layout({
		name: util.debug() ? "arbor" : "arbor",
		gravity: true
	});
	
};