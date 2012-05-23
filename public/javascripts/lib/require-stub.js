(function(){
		
	// some libraries don't share their commonjs name with their
	// global variable on the client side
	var aliases = {
		// "commonjsname": "VariableNameInWindowObj"
		"underscore": "_",
		"backbone": "Backbone"
	};

	// on the client side, require is just getting the global
	// variable associated, since everything is included via
	// <script> tags
	window.require = function( name ){

		if( aliases[name] ){
			// alias if special case
			name = aliases[name];
		} else {
			// remove ../ and ./ from start of module name
			var match = name.match(/(?:\.\.\/|\.\/)*(\w+)/);
			if( !match ){
				throw "Can not require invalid path `" + name + "`";
				return null;
			}
			name = match[1];
		}	

		return window[ name ];
	};

})();