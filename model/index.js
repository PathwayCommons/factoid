// this file exports the model module nicely so the server side can
// use it

// each new model class needs to be exposed here for it to work on
// the server side

(function(){
	if( exports ){
		// we can export everything here, since we don't have to
		// worry about kb on the server side

		// add new classes here so we can use them on the server side
		exports.Entity = require("./entity").Entity;
		exports.Entities = require("./entity").Entities;
		exports.Interaction = require("./interaction").Interaction;
		exports.Interactions = require("./interaction").Interactions;
	}
})();
