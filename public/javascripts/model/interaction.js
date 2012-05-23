(function( exports ){

	var expect = require("chai").expect;
	var __ = require("underscore");
	var Backbone = require("backbone");
	var model = require("../model");

	exports.Interaction = model.Uidable.extend({
		defaults: {
		},

		initialize: function(){
			this.attributes.participants = new model.Entities();
		},

		validate: function( attrs ){
			
		},

		connect: function( entity ){
			expect( entity ).to.be.an.instanceof( model.Entity );
			
			this.get("participants").add( entity );
		},

		disconnect: function( entity ){
			expect( entity ).to.be.an.instanceof( model.Entity );

			this.get("participants").remove( entity );
		}
	});

	exports.Interactions = Backbone.Collection.extend({
		model: model.Interaction
	});

})( typeof exports === 'undefined' ? (!this.model ? this.model = {} : this.model) : exports );