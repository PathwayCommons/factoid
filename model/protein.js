(function( exports ){

	var expect = require("chai").expect;
	var __ = require("underscore");
	var Backbone = require("backbone");
	var model = require("../model");
	var parent = model.Entity;

	exports.Protein = parent.extend({
		defaults: function(){
			return __.defaults({
				type: "protein"
			}, parent.prototype.defaults.call(this) );
		},

		validate: function( attrs, options ){
			var pret = parent.prototype.validate.call( this, attrs, options );
			if( pret ){ return pret; }
		}
	});

	exports.Proteins = Backbone.Collection.extend({
		model: model.Protein
	});

})( typeof exports === 'undefined' ? (!this.model ? this.model = {} : this.model) : exports );