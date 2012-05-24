(function( exports ){

	var expect = require("chai").expect;
	var __ = require("underscore");
	var Backbone = require("backbone");
	var model = require("../model");
	var parent = model.Entity;

	exports.Interaction = parent.extend({
		defaults: {
		},

		initialize: function(){
			this.attributes.participants = new model.Entities();
		},

		validate: function( attrs, options ){
			return parent.prototype.validate.call( this, attrs, options );
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