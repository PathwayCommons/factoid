(function( exports ){

	var expect = require("chai").expect;
	var __ = require("underscore");
	var Backbone = require("backbone");
	var model = require("../model");

	exports.Entity = model.Uidable.extend({
		defaults: {
			name: "unnamed entity"
		},

		initialize: function(){
			this.attributes.interactions = new model.Interactions();
		},

		validate: function( attrs, options ){
			var parentRet = model.Uidable.prototype.validate.call( this, attrs, options );
			if( parentRet ){ return parentRet; }

			var nameOk = attrs.name != null;
			if( !nameOk ){ return "Entity must have a name" }
		}
	});

	exports.Entities = Backbone.Collection.extend({
		model: model.Entity
	});

})( typeof exports === 'undefined' ? (!this.model ? this.model = {} : this.model) : exports );