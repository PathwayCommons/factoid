ui.relayout = function(){
	
	cy.layout({
		name: util.debug() ? "arbor" : "arbor",
		stableEnergy: function( energy ){
			var e = energy; 
			return (e.max <= 0.75) || (e.mean <= 0.5);
		}

	});
	
};