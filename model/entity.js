(function( exports ){

	var expect = require("chai").expect;
	var __ = require("underscore");
	var Backbone = require("backbone");
	var model = require("../model");

	exports.Entity = Backbone.Model.extend({
		defaults: function(){
			return {
				type: "entity",
				name: "unnamed entity", // name of entity
				uid: null, // unique id of entity according to uidsrc
				uidsrc: null, // the name of the source of the uid (e.g. "uniprot")
			};
		},

		validate: function( attrs, options ){
			// var parentRet = parent.prototype.validate.call( this, attrs, options );
			// if( parentRet ){ return parentRet; }

			var nameOk = attrs.name != null;
			if( !nameOk ){ return "Entity must have a name"; }

			var uidSet = attrs.uid != null;
			var uidsrcSet = attrs.uidsrc != null || this.get("uidsrc") != null;
			if( uidSet && !uidsrcSet ){ return "Entity must have a uid source if it has a uid"; }
		},

		associated: function(){
			return this.get("uid") != null;
		},

		associate: function( uid, src ){
			expect( uid ).to.be.a("string");
			expect( src ).to.be.a("string");

			this.set({
				uid: uid,
				uidsrc: src
			});
		}
	});

	exports.Entities = Backbone.Collection.extend({
		model: model.Entity
	});

})( typeof exports === 'undefined' ? (!this.model ? this.model = {} : this.model) : exports );