(function( exports ){

	var expect = require("chai").expect;
	var __ = require("underscore");
	var Backbone = require("backbone");
	var model = require("../model");
	var parent = model.Entity;

	var Interaction = exports.Interaction = parent.extend({
		defaults: function(){
			return __.defaults({
				type: "interaction",
				participants: new model.Entities()
			}, parent.prototype.defaults.call(this) );
		},

		validate: function( attrs, options ){
			return parent.prototype.validate.apply( this, arguments ); // super()
		},

		connect: function( entity ){
			expect( entity ).to.be.an.instanceof( model.Entity );
			
			this.get("participants").add( entity );
		},

		disconnect: function( entity ){
			expect( entity ).to.be.an.instanceof( entity );

			this.get("participants").remove( entity.get("id") );
		}
	});

	var Interactions = exports.Interactions = Backbone.Collection.extend({
		model: model.Interaction
	});

})( typeof exports === 'undefined' ? (!this.model ? this.model = {} : this.model) : exports );