// this class is used for models who can have an associated uid
(function( exports ){
	var __ = require("underscore");
	var Backbone = require("backbone");
	var model = require("../model");

	exports.Uidable = Backbone.Model.extend({
		defaults: {
			uid: null
		},

		validate: function( attrs ){
			var uidOk = attrs.uid == null || __.isString( attrs.uid );

			if( !uidOk ){ return "Entity uid must be null-like or a string" }
		},

		associated: function(){
			return this.get("uid") != null;
		}
	});

})( typeof exports === 'undefined' ? (!this.model ? this.model = {} : this.model) : exports );