(function( exports ){

	var expect = require("chai").expect;
	var __ = require("underscore");
	var Backbone = require("backbone");
	var model = require("../model");
	var parent = model.Entity;

	exports.Protein = parent.extend({
		defaults: {
			uidsrc: "uniprot"
		},

		initialize: function(){
		},

		validate: function( attrs, options ){
			var pret = parent.prototype.validate.call( this, attrs, options );
			if( pret ){ return pret; }

			var uidsrcSet = attrs.uidsrc != null;
			var uidsrcIsUniprot = attrs.uidsrc == "uniprot";
			if( uidsrcSet && !uidsrcIsUniprot ){
				return "A protein must have a uniprot uidsrc";
			}
		}
	});

	exports.Proteins = Backbone.Collection.extend({
		model: model.Protein
	});

})( typeof exports === 'undefined' ? (!this.model ? this.model = {} : this.model) : exports );