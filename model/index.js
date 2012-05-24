// this file exports the model module nicely so the server side can
// use it

(function(){
	if( exports ){
		// we can export everything here, since we don't have to
		// worry about kb on the server side

		exports.Entity = require("./entity").Entity;
		exports.Entities = require("./entity").Entities;
		exports.Interaction = require("./interaction").Interaction;
		exports.Interactions = require("./interaction").Interactions;

	}
})();
