
/* cytoscape.all.js */

/**
 * This file is part of cytoscape.js 2.0-prerelease-snapshot-2012.06.29-18.18.19.
 * 
 * Cytoscape.js is free software: you can redistribute it and/or modify it
 * under the terms of the GNU Lesser General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or (at your option) any
 * later version.
 * 
 * Cytoscape.js is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE. See the GNU Lesser General Public License for more
 * details.
 * 
 * You should have received a copy of the GNU Lesser General Public License along with
 * cytoscape.js. If not, see <http://www.gnu.org/licenses/>.
 */
 

;(function($){
	
	// make the jQuery plugin grab what we define init to be later
	$.cytoscape = function(){
		return $.cytoscape.init.apply(this, arguments);
	};
	
	// define the function namespace here, since it has members in many places
	$.cytoscape.fn = {};
	
})(jQuery);

;(function($, $$){
	
	$$.is = {
		string: function(obj){
			return obj != null && typeof obj == typeof "";
		},
		
		fn: function(obj){
			return obj != null && typeof obj === typeof function(){};
		},
		
		array: function(obj){
			return obj != null && obj instanceof Array;
		},
		
		plainObject: function(obj){
			return obj != null && typeof obj === typeof {} && !$$.is.array(obj);
		},
		
		number: function(obj){
			return obj != null && typeof obj === typeof 1 && !isNaN(obj);
		},

		integer: function( obj ){
			return $$.is.number(obj) && Math.floor(obj) === obj;
		},
		
		color: function(obj){
			return obj != null && typeof obj === typeof "" && $.Color(obj).toString() !== "";
		},
		
		bool: function(obj){
			return obj != null && typeof obj === typeof true;
		},
		
		elementOrCollection: function(obj){
			return $$.is.element(obj) || $$.is.collection(obj);
		},
		
		element: function(obj){
			return obj instanceof $$.Element && obj._private.single;
		},
		
		collection: function(obj){
			return obj instanceof $$.Collection && !obj._private.single;
		},
		
		core: function(obj){
			return obj instanceof $$.Core;
		},

		style: function(obj){
			return obj instanceof $$.Style;
		},

		stylesheet: function(obj){
			return obj instanceof $$.Stylesheet;
		},

		event: function(obj){
			return obj instanceof $$.Event;
		},

		emptyString: function(obj){
			if( !obj ){ // null is empty
				return true; 
			} else if( $$.is.string(obj) ){
				if( obj === "" || obj.match(/^\s+$/) ){
					return true; // empty string is empty
				}
			}
			
			return false; // otherwise, we don't know what we've got
		},
		
		nonemptyString: function(obj){
			if( obj && $$.is.string(obj) && obj !== "" && !obj.match(/^\s+$/) ){
				return true;
			}

			return false;
		}
	};	
	
})(jQuery, jQuery.cytoscape);

;(function($, $$){
	
	// utility functions only for internal use

	$$.util = {

		extend: $.extend,
		error: $.error,
		each: $.each,

		clone: function( obj ){
			var target = {};
			for (var i in obj) {
				if ( obj.hasOwnProperty(i) ) {
					target[i] = obj[i];
				}
			}
			return target;
		},

		// gets a shallow copy of the argument
		copy: function( obj ){
			if( obj == null ){
				return obj;
			} if( $$.is.array(obj) ){
				return $.extend([], obj);
			} else if( $$.is.plainObject(obj) ){
				return $.extend({}, obj);
			} else {
				return obj;
			}
		},
		
		// has anything been set in the map
		mapEmpty: function( map ){
			var empty = true;

			if( map != null ){
				for(var i in map){
					empty = false;
					break;
				}
			}

			return empty;
		},

		// pushes to the array at the end of a map (map may not be built)
		pushMap: function( options ){
			var array = $$.util.getMap(options);

			if( array == null ){ // if empty, put initial array
				$$.util.setMap( $.extend({}, options, {
					value: [ options.value ]
				}) );
			} else {
				array.push( options.value );
			}
		},

		// sets the value in a map (map may not be built)
		setMap: function( options ){
			var obj = options.map;
			var key;
			var keys = options.keys;
			var l = keys.length;

			for(var i = 0; i < l; i++){
				var key = keys[i];

				if( $$.is.plainObject( key ) ){
					$$.util.error("Tried to set map with object key");
				}

				if( i < keys.length - 1 ){
					
					// extend the map if necessary
					if( obj[key] == null ){
						obj[key] = {};
					}
					
					obj = obj[key];
				} else {
					// set the value
					obj[key] = options.value;
				}
			}
		},
		
		// gets the value in a map even if it's not built in places
		getMap: function( options ){
			var obj = options.map;
			var keys = options.keys;
			var l = keys.length;
			
			for(var i = 0; i < l; i++){
				var key = keys[i];

				if( $$.is.plainObject( key ) ){
					$$.util.error("Tried to get map with object key");
				}

				obj = obj[key];
				
				if( obj == null ){
					return obj;
				}
			}
			
			return obj;
		},

		// deletes the entry in the map
		deleteMap: function( options ){
			var obj = options.map;
			var keys = options.keys;
			var l = keys.length;
			var keepChildren = options.keepChildren;
			
			for(var i = 0; i < l; i++){
				var key = keys[i];

				if( $$.is.plainObject( key ) ){
					$$.util.error("Tried to delete map with object key");
				}

				var lastKey = i === options.keys.length - 1;
				if( lastKey ){
					
					if( keepChildren ){ // then only delete child fields not in keepChildren
						for( var child in obj ){
							if( !keepChildren[child] ){
								delete obj[child];
							}
						}
					} else {
						delete obj[key];
					}

				} else {
					obj = obj[key];
				}
			}
		},
		
		capitalize: function(str){
			if( $$.is.emptyString(str) ){
				return str;
			}
			
			return str.charAt(0).toUpperCase() + str.substring(1);
		},

		camel2dash: function( str ){
			var ret = [];

			for( var i = 0; i < str.length; i++ ){
				var ch = str[i];
				var chLowerCase = ch.toLowerCase();
				var isUpperCase = ch !== chLowerCase;

				if( isUpperCase ){
					ret.push( "-" );
					ret.push( chLowerCase );
				} else {
					ret.push( ch );
				}
			}

			var noUpperCases = ret.length === str.length;
			if( noUpperCases ){ return str } // cheaper than .join()

			return ret.join("");
		},

		dash2camel: function( str ){
			var ret = [];
			var nextIsUpper = false;

			for( var i = 0; i < str.length; i++ ){
				var ch = str[i];
				var isDash = ch === "-";

				if( isDash ){
					nextIsUpper = true;
				} else {
					if( nextIsUpper ){
						ret.push( ch.toUpperCase() );
					} else {
						ret.push( ch );
					}

					nextIsUpper = false;
				}
			}

			return ret.join("");
		},

		// strip spaces from beginning of string and end of string
		trim: function( str ){
			var first, last;

			// find first non-space char
			for( first = 0; first < str.length && str[first] === " "; first++ ){}

			// find last non-space char
			for( last = str.length - 1; last > first && str[last] === " "; last-- ){}

			return str.substring(first, last + 1);
		},

		// get [r, g, b] from #abc or #aabbcc
		hex2tuple: function( hex ){
			if( !(hex.length === 4 || hex.length === 7) || hex[0] !== "#" ){ return; }

			var shortHex = hex.length === 4;
			var r, g, b;
			var base = 16;

			if( shortHex ){
				r = parseInt( hex[1] + hex[1], base );
				g = parseInt( hex[2] + hex[2], base );
				b = parseInt( hex[3] + hex[3], base );
			} else {
				r = parseInt( hex[1] + hex[2], base );
				g = parseInt( hex[3] + hex[4], base );
				b = parseInt( hex[5] + hex[6], base );
			}

			return [r, g, b];
		},

		// get [r, g, b, a] from hsl(0, 0, 0) or hsla(0, 0, 0, 0)
		hsl2tuple: function( hsl ){
			var ret;
			var number = $$.util.regex.number;
			var h, s, l, a, r, g, b;

			var m = new RegExp("^hsl[a]?\\(("+ number +")\\s*,\\s*("+ number +"[%])\\s*,\\s*("+ number +"[%])(?:\\s*,\\s*("+ number +"))?\\)$").exec(hsl);
			if( m ){

				// get hue
				h = parseInt( m[1] ); 
				if( h < 0 ){
					h = ( 360 - (-1*h % 360) ) % 360;
				} else if( h > 360 ){
					h = h % 360;
				}
				h /= 360; // normalise on [0, 1]

				s = parseFloat( m[2] );
				if( s < 0 || s > 100 ){ return; } // saturation is [0, 100]
				s = s/100; // normalise on [0, 1]

				l = parseFloat( m[3] );
				if( l < 0 || l > 100 ){ return; } // lightness is [0, 100]
				l = l/100; // normalise on [0, 1]

				a = m[4];
				if( a !== undefined ){
					a = parseFloat( a );

					if( a < 0 || a > 1 ){ return; } // alpha is [0, 1]
				}

				// now, convert to rgb
				// code from http://mjijackson.com/2008/02/rgb-to-hsl-and-rgb-to-hsv-color-model-conversion-algorithms-in-javascript
				if( s === 0 ){
					r = g = b = Math.round(l * 255); // achromatic
				} else {
					function hue2rgb(p, q, t){
						if(t < 0) t += 1;
						if(t > 1) t -= 1;
						if(t < 1/6) return p + (q - p) * 6 * t;
						if(t < 1/2) return q;
						if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
						return Math.round(255 * p);
					}

					var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
					var p = 2 * l - q;
					r = hue2rgb(p, q, h + 1/3);
					g = hue2rgb(p, q, h);
					b = hue2rgb(p, q, h - 1/3);
				}

				ret = [r, g, b, a];
			}

			return ret;
		},

		// get [r, g, b, a] from rgb(0, 0, 0) or rgba(0, 0, 0, 0)
		rgb2tuple: function( rgb ){
			var ret;
			var number = $$.util.regex.number;

			var m = new RegExp("^rgb[a]?\\(("+ number +"[%]?)\\s*,\\s*("+ number +"[%]?)\\s*,\\s*("+ number +"[%]?)(?:\\s*,\\s*("+ number +"))?\\)$").exec(rgb);
			if( m ){
				ret = [];

				var isPct = [];
				for( var i = 1; i <= 3; i++ ){
					var channel = m[i];

					if( channel[ channel.length - 1 ] === "%" ){
						isPct[i] = true;
					}
					channel = parseFloat( channel );

					if( isPct[i] ){
						channel = channel/100 * 255; // normalise to [0, 255]
					}

					if( channel < 0 || channel > 255 ){ return; } // invalid channel value

					ret.push( Math.floor(channel) );
				}

				var atLeastOneIsPct = isPct[1] || isPct[2] || isPct[3];
				var allArePct = isPct[1] && isPct[2] && isPct[3];
				if( atLeastOneIsPct && !allArePct ){ return; } // must all be percent values if one is

				var alpha = m[4];
				if( alpha !== undefined ){
					alpha = parseFloat( alpha );

					if( alpha < 0 || alpha > 1 ){ return; } // invalid alpha value

					ret.push( alpha );
				}
			}

			return ret;
		},

		colorname2tuple: function( color ){
			return $$.util.colors[ color.toLowerCase() ];
		},

		color2tuple: function( color ){
			return $$.util.colorname2tuple(color)
				|| $$.util.hex2tuple(color)
				|| $$.util.rgb2tuple(color)
				|| $$.util.hsl2tuple(color);
		},

		regex: {
			number: "(?:\\d*\\.\\d+|\\d+|\\d*\\.\\d+[eE]\\d+)"
		},

		colors: {
			// special colour names
			transparent:			[0,0,0,0], // NB alpha === 0

			// regular colours
			aliceblue:				[240,248,255],
			antiquewhite:			[250,235,215],
			aqua:					[0,255,255],
			aquamarine:				[127,255,212],
			azure:					[240,255,255],
			beige:					[245,245,220],
			bisque:					[255,228,196],
			black:					[0,0,0],
			blanchedalmond:			[255,235,205],
			blue:					[0,0,255],
			blueviolet:				[138,43,226],
			brown:					[165,42,42],
			burlywood:				[222,184,135],
			cadetblue:				[95,158,160],
			chartreuse:				[127,255,0],
			chocolate:				[210,105,30],
			coral:					[255,127,80],
			cornflowerblue:			[100,149,237],
			cornsilk:				[255,248,220],
			crimson:				[220,20,60],
			cyan:					[0,255,255],
			darkblue:				[0,0,139],
			darkcyan:				[0,139,139],
			darkgoldenrod:			[184,134,11],
			darkgray:				[169,169,169],
			darkgreen:				[0,100,0],
			darkgrey:				[169,169,169],
			darkkhaki:				[189,183,107],
			darkmagenta:			[139,0,139],
			darkolivegreen:			[85,107,47],
			darkorange:				[255,140,0],
			darkorchid:				[153,50,204],
			darkred:				[139,0,0],
			darksalmon:				[233,150,122],
			darkseagreen:			[143,188,143],
			darkslateblue:			[72,61,139],
			darkslategray:			[47,79,79],
			darkslategrey:			[47,79,79],
			darkturquoise:			[0,206,209],
			darkviolet:				[148,0,211],
			deeppink:				[255,20,147],
			deepskyblue:			[0,191,255],
			dimgray:				[105,105,105],
			dimgrey:				[105,105,105],
			dodgerblue:				[30,144,255],
			firebrick:				[178,34,34],
			floralwhite:			[255,250,240],
			forestgreen:			[34,139,34],
			fuchsia:				[255,0,255],
			gainsboro:				[220,220,220],
			ghostwhite:				[248,248,255],
			gold:					[255,215,0],
			goldenrod:				[218,165,32],
			gray:					[128,128,128],
			grey:					[128,128,128],
			green:					[0,128,0],
			greenyellow:			[173,255,47],
			honeydew:				[240,255,240],
			hotpink:				[255,105,180],
			indianred:				[205,92,92],
			indigo:					[75,0,130],
			ivory:					[255,255,240],
			khaki:					[240,230,140],
			lavender:				[230,230,250],
			lavenderblush:			[255,240,245],
			lawngreen:				[124,252,0],
			lemonchiffon:			[255,250,205],
			lightblue:				[173,216,230],
			lightcoral:				[240,128,128],
			lightcyan:				[224,255,255],
			lightgoldenrodyellow:	[250,250,210],
			lightgray:				[211,211,211],
			lightgreen:				[144,238,144],
			lightgrey:				[211,211,211],
			lightpink:				[255,182,193],
			lightsalmon:			[255,160,122],
			lightseagreen:			[32,178,170],
			lightskyblue:			[135,206,250],
			lightslategray:			[119,136,153],
			lightslategrey:			[119,136,153],
			lightsteelblue:			[176,196,222],
			lightyellow:			[255,255,224],
			lime:					[0,255,0],
			limegreen:				[50,205,50],
			linen:					[250,240,230],
			magenta:				[255,0,255],
			maroon:					[128,0,0],
			mediumaquamarine:		[102,205,170],
			mediumblue:				[0,0,205],
			mediumorchid:			[186,85,211],
			mediumpurple:			[147,112,219],
			mediumseagreen:			[60,179,113],
			mediumslateblue:		[123,104,238],
			mediumspringgreen:		[0,250,154],
			mediumturquoise:		[72,209,204],
			mediumvioletred:		[199,21,133],
			midnightblue:			[25,25,112],
			mintcream:				[245,255,250],
			mistyrose:				[255,228,225],
			moccasin:				[255,228,181],
			navajowhite:			[255,222,173],
			navy:					[0,0,128],
			oldlace:				[253,245,230],
			olive:					[128,128,0],
			olivedrab:				[107,142,35],
			orange:					[255,165,0],
			orangered:				[255,69,0],
			orchid:					[218,112,214],
			palegoldenrod:			[238,232,170],
			palegreen:				[152,251,152],
			paleturquoise:			[175,238,238],
			palevioletred:			[219,112,147],
			papayawhip:				[255,239,213],
			peachpuff:				[255,218,185],
			peru:					[205,133,63],
			pink:					[255,192,203],
			plum:					[221,160,221],
			powderblue:				[176,224,230],
			purple:					[128,0,128],
			red:					[255,0,0],
			rosybrown:				[188,143,143],
			royalblue:				[65,105,225],
			saddlebrown:			[139,69,19],
			salmon:					[250,128,114],
			sandybrown:				[244,164,96],
			seagreen:				[46,139,87],
			seashell:				[255,245,238],
			sienna:					[160,82,45],
			silver:					[192,192,192],
			skyblue:				[135,206,235],
			slateblue:				[106,90,205],
			slategray:				[112,128,144],
			slategrey:				[112,128,144],
			snow:					[255,250,250],
			springgreen:			[0,255,127],
			steelblue:				[70,130,180],
			tan:					[210,180,140],
			teal:					[0,128,128],
			thistle:				[216,191,216],
			tomato:					[255,99,71],
			turquoise:				[64,224,208],
			violet:					[238,130,238],
			wheat:					[245,222,179],
			white:					[255,255,255],
			whitesmoke:				[245,245,245],
			yellow:					[255,255,0],
			yellowgreen:			[154,205,50]
		}
			
	};
	
})(jQuery, jQuery.cytoscape);

;(function($, $$){
	
	// registered extensions to cyto, indexed by name
	var extensions = {};
	$$.extensions = extensions;
	
	// registered modules for extensions, indexed by name
	var modules = {};
	$$.modules = modules;
	
	function setExtension(type, name, registrant){
		var impl = {};
		impl[name] = registrant;
		
		switch( type ){
		case "core":
		case "collection":
			$$.fn[type]( impl );
		}
		
		return $$.util.setMap({
			map: extensions,
			keys: [ type, name ],
			value: registrant
		});
	}
	
	function getExtension(type, name){
		return $$.util.getMap({
			map: extensions,
			keys: [ type, name ]
		});
	}
	
	function setModule(type, name, moduleType, moduleName, registrant){
		return $$.util.setMap({
			map: modules,
			keys: [ type, name, moduleType, moduleName ],
			value: registrant
		});
	}
	
	function getModule(type, name, moduleType, moduleName){
		return $$.util.getMap({
			map: modules,
			keys: [ type, name, moduleType, moduleName ]
		});
	}
	
	$$.extension = function(){
		// e.g. $$.extension("renderer", "svg")
		if( arguments.length == 2 ){
			return getExtension.apply(this, arguments);
		}
		
		// e.g. $$.extension("renderer", "svg", { ... })
		else if( arguments.length == 3 ){
			return setExtension.apply(this, arguments);
		}
		
		// e.g. $$.extension("renderer", "svg", "nodeShape", "ellipse")
		else if( arguments.length == 4 ){
			return getModule.apply(this, arguments);
		}
		
		// e.g. $$.extension("renderer", "svg", "nodeShape", "ellipse", { ... })
		else if( arguments.length == 5 ){
			return setModule.apply(this, arguments);
		}
		
		else {
			$.error("Invalid extension access syntax");
		}
	
	};
	
})(jQuery, jQuery.cytoscape);

;(function($, $$){
	
	// allow calls on a jQuery selector by proxying calls to $.cytoscape
	// e.g. $("#foo").cytoscape(options) => $.cytoscape(options) on #foo
	$.fn.cytoscape = function(opts){
		var $this = $(this);

		// get object
		if( opts == "get" ){
			var data = $(this).data("cytoscape");
			return data.cy;
		}
		
		// bind to ready
		else if( $$.is.fn(opts) ){
			var ready = opts;
			var data = $this.data("cytoscape");
			
			if( data != null && data.cy != null && data.ready ){
				// already ready so just trigger now
				ready.apply(data.cy, []);
			} else {
				// not yet ready, so add to readies list
				
				if( data == null ){
					data = {}
				}
				
				if( data.readies == null ){
					data.readies = [];
				}
				
				data.readies.push(ready);
				$(this).data("cytoscape", data);
			} 
			
		}
		
		// proxy to create instance
		else if( $$.is.plainObject(opts) ){
			return $this.each(function(){
				var options = $.extend({}, opts, {
					container: $(this)
				});
			
				$.cytoscape(options);
			});
		}
		
		// proxy a function call
		else {
			var rets = [];
			var args = [];
			for(var i = 1; i < arguments.length; i++){
				args[i - 1] = arguments[i];
			}
			
			$this.each(function(){
				var data = $(this).data("cytoscape");
				var cy = data.cy;
				var fnName = opts;
				
				if( cy != null && $$.is.fn( cy[fnName] ) ){
					var ret = cy[fnName].apply(cy, args);
					rets.push(ret);
				}
			});
			
			// if only one instance, don't need to return array
			if( rets.length == 1 ){
				rets = rets[0];
			} else if( rets.length == 0 ){
				rets = $(this);
			}
			
			return rets;
		}

	};
	
	// allow functional access to cytoscape.js
	// e.g. var cyto = $.cytoscape({ selector: "#foo", ... });
	//      var nodes = cyto.nodes();
	$$.init = function( options ){
		
		// create instance
		if( $$.is.plainObject( options ) ){
			return new $$.Core( options );
		} 
		
		// allow for registration of extensions
		// e.g. $.cytoscape("renderer", "svg", SvgRenderer);
		// e.g. $.cytoscape("renderer", "svg", "nodeshape", "ellipse", SvgEllipseNodeShape);
		// e.g. $.cytoscape("core", "doSomething", function(){ /* doSomething code */ });
		// e.g. $.cytoscape("collection", "doSomething", function(){ /* doSomething code */ });
		else if( $$.is.string( options ) ) {
			return $$.extension.apply($$.extension, arguments);
		}
	};
	
	// use short alias (cy) if not already defined
	if( $.fn.cy == null && $.cy == null ){
		$.fn.cy = $.fn.cytoscape;
		$.cy = $.cytoscape;
	}
	
})(jQuery, jQuery.cytoscape);

;(function($, $$){
	
	// shamelessly taken from jQuery
	// https://github.com/jquery/jquery/blob/master/src/event.js

	$$.Event = function( src, props ) {
		// Allow instantiation without the 'new' keyword
		if ( !(this instanceof $$.Event) ) {
			return new $$.Event( src, props );
		}

		// Event object
		if ( src && src.type ) {
			this.originalEvent = src;
			this.type = src.type;

			// Events bubbling up the document may have been marked as prevented
			// by a handler lower down the tree; reflect the correct value.
			this.isDefaultPrevented = ( src.defaultPrevented || src.returnValue === false ||
				src.getPreventDefault && src.getPreventDefault() ) ? returnTrue : returnFalse;

		// Event type
		} else {
			this.type = src;
		}

		// Put explicitly provided properties onto the event object
		if ( props ) {
			$$.util.extend( this, props );
		}

		// Create a timestamp if incoming event doesn't have one
		this.timeStamp = src && src.timeStamp || +new Date;

		// Mark it as fixed
		//this[ jQuery.expando ] = true;
	};

	function returnFalse() {
		return false;
	}
	function returnTrue() {
		return true;
	}

	// jQuery.Event is based on DOM3 Events as specified by the ECMAScript Language Binding
	// http://www.w3.org/TR/2003/WD-DOM-Level-3-Events-20030331/ecma-script-binding.html
	$$.Event.prototype = {
		preventDefault: function() {
			this.isDefaultPrevented = returnTrue;

			var e = this.originalEvent;
			if ( !e ) {
				return;
			}

			// if preventDefault exists run it on the original event
			if ( e.preventDefault ) {
				e.preventDefault();

			// otherwise set the returnValue property of the original event to false (IE)
			} else {
				e.returnValue = false;
			}
		},
		stopPropagation: function() {
			this.isPropagationStopped = returnTrue;

			var e = this.originalEvent;
			if ( !e ) {
				return;
			}
			// if stopPropagation exists run it on the original event
			if ( e.stopPropagation ) {
				e.stopPropagation();
			}
			// otherwise set the cancelBubble property of the original event to true (IE)
			e.cancelBubble = true;
		},
		stopImmediatePropagation: function() {
			this.isImmediatePropagationStopped = returnTrue;
			this.stopPropagation();
		},
		isDefaultPrevented: returnFalse,
		isPropagationStopped: returnFalse,
		isImmediatePropagationStopped: returnFalse
	};
	
	
})(jQuery, jQuery.cytoscape);

;(function($, $$){
	
	// metaprogramming makes me happy

	// use this module to cherry pick functions into your prototype
	// (useful for functions shared between the core and collections, for example)

	// e.g.
	// $$.fn.collection({
	//   foo: $$.define.foo({ /* params... */ })
	// });

	$$.define = {

		// access data field
		data: function( params ){
			var defaults = { 
				field: "data",
				bindingEvent: "data",
				allowBinding: false,
				allowSetting: false,
				allowGetting: false,
				settingEvent: "data",
				settingTriggersEvent: false,
				triggerFnName: "trigger",
				immutableKeys: {}, // key => true if immutable
				updateMappers: false
			};
			params = $$.util.extend({}, defaults, params);

			return function( name, value ){
				var p = params;
				var self = this;
				var selfIsArrayLike = self.length !== undefined;
				var all = selfIsArrayLike ? self : [self]; // put in array if not array-like
				var single = selfIsArrayLike ? self[0] : self;

				// .data("foo", ...)
				if( $$.is.string(name) ){ // set or get property

					// .data("foo")
					if( p.allowGetting && value === undefined ){ // get

						var ret;
						if( single ){
							ret = single._private[ p.field ][ name ];
						}
						return ret;
					
					// .data("foo", "bar")
					} else if( p.allowSetting && value !== undefined ) { // set
						var valid = !p.immutableKeys[name];
						if( valid ){

							for( var i = 0, l = all.length; i < l; i++ ){
								all[i]._private[ p.field ][ name ] = value;
							}

							// update mappers if asked
							if( p.updateMappers ){ self.updateMappers(); }

							if( p.settingTriggersEvent ){
								self[ p.triggerFnName ]( p.settingEvent );
							}
						}
					}

				// .data({ "foo": "bar" })
				} else if( p.allowSetting && $$.is.plainObject(name) ){ // extend
					var obj = name;
					var k, v;

					for( k in obj ){
						v = obj[ k ];

						var valid = !p.immutableKeys[k];
						if( valid ){
							for( var i = 0, l = all.length; i < l; i++ ){
								all[i]._private[ p.field ][ k ] = v;
							}
						}
					}
					
					// update mappers if asked
					if( p.updateMappers ){ self.updateMappers(); }

					if( p.settingTriggersEvent ){
						self[ p.triggerFnName ]( p.settingEvent );
					}
				
				// .data(function(){ ... })
				} else if( p.allowBinding && $$.is.fn(name) ){ // bind to event
					var fn = name;
					self.bind( p.bindingEvent, fn );
				
				// .data()
				} else if( p.allowGetting && name === undefined ){ // get whole object
					var ret;
					if( single ){
						ret = single._private[ p.field ];
					}
					return ret;
				}

				return self; // maintain chainability
			}; // function
		}, // data

		// remove data field
		removeData: function( params ){
			var defaults = { 
				field: "data",
				event: "data",
				triggerFnName: "trigger",
				triggerEvent: false,
				immutableKeys: {} // key => true if immutable
			};
			params = $$.util.extend({}, defaults, params);

			return function( names ){
				var p = params;
				var self = this;
				var selfIsArrayLike = self.length !== undefined;
				var all = selfIsArrayLike ? self : [self]; // put in array if not array-like
				var single = selfIsArrayLike ? self[0] : self;
				
				// .removeData("foo bar")
				if( $$.is.string(names) ){ // then get the list of keys, and delete them
					var keys = names.split(/\s+/);
					var l = keys.length;

					for( var i = 0; i < l; i++ ){ // delete each non-empty key
						var key = keys[i];
						if( $$.is.emptyString(key) ){ continue; }

						var valid = !p.immutableKeys[ key ]; // not valid if immutable
						if( valid ){
							for( var i_a = 0, l_a = all.length; i_a < l_a; i_a++ ){
								delete all[ i_a ]._private[ p.field ][ key ];
							}
						}
					}

					if( p.triggerEvent ){
						self[ p.triggerFnName ]( p.event );
					}

				// .removeData()
				} else if( names === undefined ){ // then delete all keys

					for( var i_a = 0, l_a = all.length; i_a < l_a; i_a++ ){
						var _privateFields = all[ i_a ]._private[ p.field ];
						
						for( var key in _privateFields ){
							var validKeyToDelete = !p.immutableKeys[ key ];

							if( validKeyToDelete ){
								delete _privateFields[ key ];
							}
						}
					}

					if( p.triggerEvent ){
						self[ p.triggerFnName ]( p.event );
					}
				}

				return self; // maintain chaining
			}; // function
		}, // removeData

		// event function reusable stuff
		event: {
			regex: /(\w+)(\.\w+)?/, // regex for matching event strings (e.g. "click.namespace")
			optionalTypeRegex: /(\w+)?(\.\w+)?/,

			// properties to copy to the event obj
			props: "altKey bubbles button cancelable charCode clientX clientY ctrlKey currentTarget data detail eventPhase metaKey offsetX offsetY originalTarget pageX pageY prevValue relatedTarget screenX screenY shiftKey target view which".split(/\s+/),

			aliases: "mousedown mouseup click mouseover mouseout mousemove touchstart touchmove touchend grab drag free".split(/\s+/),

			aliasesOn: function( thisPrototype ){

				var aliases = $$.define.event.aliases;
				for( var i = 0; i < aliases.length; i++ ){
					var eventType = aliases[i];

					thisPrototype[ eventType ] = function(data, callback){
						if( $$.is.fn(callback) ){
							this.on(eventType, data, callback);

						} else if( $$.is.fn(data) ){
							callback = data;
							this.on(eventType, callback);

						} else {
							this.trigger(eventType);
						}

						return this; // maintain chaining
					};
				}
			},

			falseCallback: function(){ return false; }
		},

		// event binding
		on: function( params ){
			var defaults = {
				unbindSelfOnTrigger: false,
				unbindAllBindersOnTrigger: false
			};
			params = $$.util.extend({}, defaults, params);
			
			return function(events, selector, data, callback){
				var self = this;
				var selfIsArrayLike = self.length !== undefined;
				var all = selfIsArrayLike ? self : [self]; // put in array if not array-like
				var single = selfIsArrayLike ? self[0] : self;
				var eventsIsString = $$.is.string(events);
				var p = params;

				if( $$.is.plainObject(selector) ){ // selector is actually data
					callback = data;
					data = selector;
					selector = undefined;
				} else if( $$.is.fn(selector) || selector === false ){ // selector is actually callback
					callback = selector;
					data = undefined;
					selector = undefined;
				}

				if( $$.is.fn(data) || data === false ){ // data is actually callback
					callback = data;
					data = undefined;
				}

				// if there isn't a callback, we can't really do anything
				// (can't speak for mapped events arg version)
				if( !($$.is.fn(callback) || callback === false) && eventsIsString ){
					return self; // maintain chaining
				}

				if( eventsIsString ){ // then convert to map
					var map = {};
					map[ events ] = callback;
					events = map;
				}

				for( var evts in events ){
					callback = events[evts];
					if( callback === false ){
						callback = $$.define.event.falseCallback;
					}

					if( !$$.is.fn(callback) ){ continue; }

					evts = evts.split(/\s+/);
					for( var i = 0; i < evts.length; i++ ){
						var evt = evts[i];
						if( $$.is.emptyString(evt) ){ continue; }

						var match = evt.match( $$.define.event.regex ); // type[.namespace]

						if( match ){
							var type = match[1];
							var namespace = match[2] ? match[2] : undefined;

							var listener = {
								callback: callback, // callback to run
								data: data, // extra data in eventObj.data
								delegated: selector ? true : false, // whether the evt is delegated
								selector: selector, // the selector to match for delegated events
								type: type, // the event type (e.g. "click")
								namespace: namespace, // the event namespace (e.g. ".foo")
								unbindSelfOnTrigger: p.unbindSelfOnTrigger,
								unbindAllBindersOnTrigger: p.unbindAllBindersOnTrigger,
								binders: all // who bound together
							};

							for( var j = 0; j < all.length; j++ ){
								all[j]._private.listeners.push( listener );
							}
						}
					} // for events array
				} // for events map
				
				return self; // maintain chaining
			}; // function
		}, // on

		off: function( params ){
			var defaults = {
			};
			params = $$.util.extend({}, defaults, params);
			
			return function(events, selector, callback){
				var self = this;
				var selfIsArrayLike = self.length !== undefined;
				var all = selfIsArrayLike ? self : [self]; // put in array if not array-like
				var single = selfIsArrayLike ? self[0] : self;
				var eventsIsString = $$.is.string(events);
				var p = params;

				if( arguments.length === 0 ){ // then unbind all

					for( var i = 0; i < all.length; i++ ){
						all[i]._private.listeners = [];
					}

					return self; // maintain chaining
				}

				if( $$.is.fn(selector) || selector === false ){ // selector is actually callback
					callback = selector;
					selector = undefined;
				}

				if( eventsIsString ){ // then convert to map
					var map = {};
					map[ events ] = callback;
					events = map;
				}

				for( var evts in events ){
					callback = events[evts];

					if( callback === false ){
						callback = $$.define.event.falseCallback;
					}

					evts = evts.split(/\s+/);
					for( var h = 0; h < evts.length; h++ ){
						var evt = evts[h];
						if( $$.is.emptyString(evt) ){ continue; }

						var match = evt.match( $$.define.event.optionalTypeRegex ); // [type][.namespace]
						if( match ){
							var type = match[1] ? match[1] : undefined;
							var namespace = match[2] ? match[2] : undefined;

							for( var i = 0; i < all.length; i++ ){ //
								var listeners = all[i]._private.listeners;

								for( var j = 0; j < listeners.length; j++ ){
									var listener = listeners[j];
									var nsMatches = !namespace || namespace === listener.namespace;
									var typeMatches = !type || listener.type === type;
									var cbMatches = !callback || callback === listener.callback;
									var listenerMatches = nsMatches && typeMatches && cbMatches;

									// delete listener if it matches
									if( listenerMatches ){
										listeners.splice(j, 1);
										j--;
									}
								} // for listeners
							} // for all
						} // if match
					} // for events array

				} // for events map
				
				return self; // maintain chaining
			}; // function
		}, // off

		trigger: function( params ){
			var defaults = {};
			params = $$.util.extend({}, defaults, params);
			
			return function(events, extraParams){
				var self = this;
				var selfIsArrayLike = self.length !== undefined;
				var all = selfIsArrayLike ? self : [self]; // put in array if not array-like
				var single = selfIsArrayLike ? self[0] : self;
				var eventsIsString = $$.is.string(events);
				var eventsIsObject = $$.is.plainObject(events);
				var eventsIsEvent = $$.is.event(events);
				var p = params;
				var cy = this._private.cy || this;

				if( eventsIsString ){ // then make a plain event object for each event name
					var evts = events.split(/\s+/);
					events = [];

					for( var i = 0; i < evts.length; i++ ){
						var evt = evts[i];
						if( $$.is.emptyString(evt) ){ continue; }

						var match = evt.match( $$.define.event.regex ); // type[.namespace]
						var type = match[1];
						var namespace = match[2] ? match[2] : undefined;

						events.push( {
							type: type,
							namespace: namespace
						} );
					}
				} else if( eventsIsObject ){ // put in length 1 array
					var eventArgObj = events;

					events = [ eventArgObj ];
				}

				if( extraParams ){
					if( !$$.is.array(extraParams) ){ // make sure extra params are in an array if specified
						extraParams = [ extraParams ];
					}
				} else { // otherwise, we've got nothing
					extraParams = [];
				}

				for( var i = 0; i < events.length; i++ ){ // trigger each event in order
					var evtObj = events[i];
					
					for( var j = 0; j < all.length; j++ ){ // for each
						var triggerer = all[j];
						var listeners = triggerer._private.listeners;
						var triggererIsElement = $$.is.element(triggerer);
						var bubbleUp = triggererIsElement;

						// create the event for this element from the event object
						var evt;

						if( eventsIsEvent ){ // then just get the object
							evt = evtObj;

						} else { // then we have to make one
							evt = new $$.Event( evtObj, {
								cyTarget: triggerer,
								cy: cy,
								namespace: evtObj.namespace
							} );

							// copy properties like jQuery does
							var props = $$.define.event.props;
							for( var k = 0; k < props.length; k++ ){
								var prop = props[k];
								evt[ prop ] = evtObj[ prop ];
							}
						}

						for( var k = 0; k < listeners.length; k++ ){ // check each listener
							var lis = listeners[k];
							var nsMatches = !lis.namespace || lis.namespace === evt.namespace;
							var typeMatches = lis.type === evt.type;
							var targetMatches = lis.delegated ? ( triggerer !== evt.cyTarget && $$.is.element(evt.cyTarget) && evt.cyTarget.is(lis.selector) ) : (true); // we're not going to validate the hierarchy; that's too expensive
							var listenerMatches = nsMatches && typeMatches && targetMatches;

							if( listenerMatches ){ // then trigger it
								var args = [ evt ];
								args = args.concat( extraParams ); // add extra params to args list

								if( lis.data ){ // add on data plugged into binding
									evt.data = lis.data;
								} else { // or clear it in case the event obj is reused
									evt.data = undefined;
								}

								if( lis.unbindSelfOnTrigger || lis.unbindAllBindersOnTrigger ){ // then remove listener
									listeners.splice(k, 1);
									k--;
								}

								if( lis.unbindAllBindersOnTrigger ){ // then delete the listener for all binders
									var binders = lis.binders;
									for( var l = 0; l < binders.length; l++ ){
										var binder = binders[l];
										if( !binder || binder === triggerer ){ continue; } // already handled triggerer or we can't handle it

										var binderListeners = binder._private.listeners;
										for( var m = 0; m < binderListeners.length; m++ ){
											var binderListener = binderListeners[m];

											if( binderListener === lis ){ // delete listener from list
												binderListeners.splice(m, 1);
												m--;
											}
										}
									}
								}

								// run the callback
								var context = lis.delegated ? evt.cyTarget : triggerer;
								var ret = lis.callback.apply( context, args );

								if( ret === false || evt.isPropagationStopped() ){
									// then don't bubble
									bubbleUp = false;

									if( ret === false ){
										// returning false is a shorthand for stopping propagation and preventing the def. action
										evt.stopPropagation();
										evt.preventDefault();
									}
								}
							} // if listener matches
						} // for each listener

						// bubble up event for elements
						if( bubbleUp ){
							var parent = triggerer.parent();
							var hasParent = parent.length !== 0;

							if( hasParent ){ // then bubble up to parent
								parent = parent[0];
								parent.trigger(evt);
							} else { // otherwise, bubble up to the core
								cy.trigger(evt);
							}
						}

					} // for each of all
				} // for each event
				
				return self; // maintain chaining
			}; // function
		} // trigger

	}; // define

	
})(jQuery, jQuery.cytoscape);

;(function($, $$){
	
	$$.Style = function( cy ){

		if( !(this instanceof $$.Style) ){
			return new $$.Style(cy);
		}

		if( !$$.is.core(cy) ){
			$$.util.error("A style must have a core reference");
			return;
		}

		this._private = {
			cy: cy,
			coreStyle: {}
		};
		
		this.length = 0;

		this.addDefaultStylesheet();
	};

	// nice-to-have aliases
	$$.style = $$.Style;
	$$.styfn = $$.Style.prototype;

	// define functions in the Style prototype
	$$.fn.style = function( fnMap, options ){
		for( var fnName in fnMap ){
			var fn = fnMap[ fnName ];
			$$.Style.prototype = fn;
		}
	};

	// a dummy stylesheet object that doesn't need a reference to the core
	$$.stylesheet = $$.Stylesheet = function(){
		if( !(this instanceof $$.Stylesheet) ){
			return new $$.Stylesheet();
		}

		this.length = 0;
	};

	// just store the selector to be parsed later
	$$.Stylesheet.prototype.selector = function( selector ){
		var i = this.length++;

		this[i] = {
			selector: selector,
			properties: []
		};

		return this; // chaining
	};

	// just store the property to be parsed later
	$$.Stylesheet.prototype.css = function( name, value ){
		var i = this.length - 1;

		if( $$.is.string(name) ){
			this[i].properties.push({
				name: name,
				value: value
			});
		} else if( $$.is.plainObject(name) ){
			map = name;

			for( var j = 0; j < $$.style.properties.length; j++ ){
				var prop = $$.style.properties[j];
				var mapVal = map[ prop.name ];

				if( mapVal === undefined ){ // also try camel case name
					mapVal = map[ $$.util.dash2camel(prop.name) ];
				}

				if( mapVal !== undefined ){
					var name = prop.name;
					var value = mapVal;

					this[i].properties.push({
						name: name,
						value: value
					});
				}
			}
		}

		return this; // chaining
	};

	// generate a real style object from the dummy stylesheet
	$$.Stylesheet.prototype.generateStyle = function( cy ){
		var style = new $$.Style(cy);

		for( var i = 0; i < this.length; i++ ){
			var context = this[i];
			var selector = context.selector;
			var props = context.properties;

			style.selector(selector); // apply selector

			for( var j = 0; j < props.length; j++ ){
				var prop = props[j];

				style.css( prop.name, prop.value ); // apply property
			}
		}

		return style;
	};

	(function(){
		var number = $$.util.regex.number;

		// each visual style property has a type and needs to be validated according to it
		$$.style.types = {
			zeroOneNumber: { number: true, min: 0, max: 1, unitless: true },
			nonNegativeInt: { number: true, min: 0, integer: true, unitless: true },
			size: { number: true, min: 0 },
			color: { color: true },
			lineStyle: { enums: ["solid", "dotted", "dashed"] },
			fontFamily: { regex: "^([\\w- ]+(?:\\s*,\\s*[\\w- ]+)*)$" },
			fontVariant: { enums: ["small-caps", "normal"] },
			fontStyle: { enums: ["italic", "normal", "oblique"] },
			fontWeight: { enums: ["normal", "bold", "bolder", "lighter", "100", "200", "300", "400", "500", "600", "800", "900", 100, 200, 300, 400, 500, 600, 700, 800, 900] },
			textDecoration: { enums: ["none", "underline", "overline", "line-through"] },
			textTransform: { enums: ["none", "capitalize", "uppercase", "lowercase"] },
			nodeShape: { enums: ["rectangle", "roundrectangle", "ellipse", "triangle"] },
			arrowShape: { enums: ["tee", "triangle", "square", "circle", "diamond", "none"] },
			visibility: { enums: ["hidden", "visible"] },
			valign: { enums: ["top", "center", "bottom"] },
			halign: { enums: ["left", "center", "right"] },
			cursor: { enums: ["auto", "crosshair", "default", "e-resize", "n-resize", "ne-resize", "nw-resize", "pointer", "progress", "s-resize", "sw-resize", "text", "w-resize", "wait", "grab", "grabbing"] },
			text: { string: true },
			data: { mapping: true, regex: "^data\\s*\\(\\s*(\\w+)\\s*\\)$" },
			mapData: { mapping: true, regex: "^mapData\\((\\w+)\\s*\\,\\s*(" + number + ")\\s*\\,\\s*(" + number + ")\\s*,\\s*(\\w+)\\s*\\,\\s*(\\w+)\\)$" }
		};

		// define visual style properties
		var t = $$.style.types;
		$$.style.properties = [
			// these are for elements
			{ name: "cursor", type: t.cursor },
			{ name: "text-valign", type: t.valign },
			{ name: "text-halign", type: t.halign },
			{ name: "color", type: t.color },
			{ name: "content", type: t.text },
			{ name: "text-outline-color", type: t.color },
			{ name: "text-outline-width", type: t.size },
			{ name: "text-outline-opacity", type: t.zeroOneNumber },
			{ name: "text-opacity", type: t.zeroOneNumber },
			{ name: "text-decoration", type: t.textDecoration },
			{ name: "text-transform", type: t.textTransform },
			{ name: "font-family", type: t.fontFamily },
			{ name: "font-style", type: t.fontStyle },
			{ name: "font-variant", type: t.fontVariant },
			{ name: "font-weight", type: t.fontWeight },
			{ name: "font-size", type: t.size },
			{ name: "visibility", type: t.visibility },
			{ name: "opacity", type: t.zeroOneNumber },
			{ name: "z-index", type: t.nonNegativeInt },

			// these are just for nodes
			{ name: "background-color", type: t.color },
			{ name: "background-opacity", type: t.zeroOneNumber },
			{ name: "border-color", type: t.color },
			{ name: "border-opacity", type: t.zeroOneNumber },
			{ name: "border-width", type: t.size },
			{ name: "border-style", type: t.lineStyle },
			{ name: "height", type: t.size },
			{ name: "width", type: t.size },
			{ name: "shape", type: t.nodeShape },

			// these are just for edges
			{ name: "source-arrow-shape", type: t.arrowShape },
			{ name: "target-arrow-shape", type: t.arrowShape },
			{ name: "source-arrow-color", type: t.color },
			{ name: "target-arrow-color", type: t.color },
			{ name: "line-style", type: t.lineStyle },
			{ name: "line-color", type: t.color },

			// these are just for the core
			{ name: "selection-box-color", type: t.color },
			{ name: "selection-box-opacity", type: t.zeroOneNumber },
			{ name: "selection-box-border-color", type: t.color },
			{ name: "selection-box-border-width", type: t.size },
			{ name: "panning-cursor", type: t.cursor }
		];

		// allow access of properties by name ( e.g. $$.style.properties.height )
		var props = $$.style.properties;
		for( var i = 0; i < props.length; i++ ){
			var prop = props[i];
			
			props[ prop.name ] = prop; // allow lookup by name
		}
	})();

	// adds the default stylesheet to the current style
	$$.styfn.addDefaultStylesheet = function(){
		// to be nice, we build font related style properties from the core container
		// so that cytoscape matches the style of its container by default
		var fontFamily = this.containerPropertyAsString("font-family") || "sans-serif";
		var fontStyle = this.containerPropertyAsString("font-style") || "normal";
		var fontVariant = this.containerPropertyAsString("font-variant") || "normal";
		var fontWeight = this.containerPropertyAsString("font-weight") || "normal";
		var color = this.containerPropertyAsString("color") || "#000";
		var textTransform = this.containerPropertyAsString("text-transform") || "none";
		var textDecoration = this.containerPropertyAsString("text-decoration") || "none";
		var fontSize = this.containerPropertyAsString("font-size") || 12;

		// fill the style with the default stylesheet
		this
			.selector("node, edge") // common properties
				.css({
					"cursor": "default",
					"text-valign": "top",
					"text-halign": "center",
					"color": color,
					"content": undefined, // => no label
					"text-outline-color": "transparent",
					"text-outline-width": 0,
					"text-outline-opacity": 1,
					"text-opacity": 1,
					"text-decoration": "none",
					"text-transform": textTransform,
					"font-family": fontFamily,
					"font-style": fontStyle,
					"font-variant": fontVariant,
					"font-weight": fontWeight,
					"font-size": fontSize,
					"visibility": "visible",
					"opacity": 1,
					"z-index": 0,
					"content": ""
				})
			.selector("node") // just node properties
				.css({
					"background-color": "#888",
					"background-opacity": 1,
					"border-color": "#000",
					"border-opacity": 1,
					"border-width": 0,
					"border-style": "solid",
					"height": 30,
					"width": 30,
					"shape": "ellipse"
				})
			.selector("edge") // just edge properties
				.css({
					"source-arrow-shape": "none",
					"target-arrow-shape": "none",
					"source-arrow-color": "#bbb",
					"target-arrow-color": "#bbb",
					"line-style": "solid",
					"line-color": "#bbb",
					"width": 1
				})
			.selector("core") // just core properties
				.css({
					"selection-box-color": "#ddd",
					"selection-box-opacity": 0.65,
					"selection-box-border-color": "#aaa",
					"selection-box-border-width": 1,
					"panning-cursor": "grabbing"
				})
		;
	};

	// remove all contexts
	$$.styfn.clear = function(){
		for( var i = 0; i < this.length; i++ ){
			delete this[i];
		}
		this.length = 0;

		return this; // chaining
	};

	// builds a style object for the "core" selector
	$$.styfn.core = function(){
		return this._private.coreStyle;
	};

	// parse a property; return null on invalid; return parsed property otherwise
	// fields :
	// - name : the name of the property
	// - value : the parsed, native-typed value of the property
	// - strValue : a string value that represents the property value in valid css
	// - bypass : true iff the property is a bypass property
	$$.styfn.parse = function( name, value, propIsBypass ){
		
		name = $$.util.camel2dash( name ); // make sure the property name is in dash form (e.g. "property-name" not "propertyName")
		var property = $$.style.properties[ name ];
		
		if( !property ){ return null; } // return null on property of unknown name
		if( value === undefined || value === null ){ return null; } // can't assign null

		var valueIsString = $$.is.string(value);
		if( valueIsString ){ // trim the value to make parsing easier
			value = $$.util.trim( value );
		}

		var type = property.type;
		if( !type ){ return null; } // no type, no luck

		// check if bypass is null or empty string (i.e. indication to delete bypass property)
		if( propIsBypass && (value === "" || value === null) ){
			return {
				name: name,
				value: value,
				bypass: true,
				deleteBypass: true
			};
		}

		// check if value is mapped
		var data, mapData;
		if( !valueIsString ){
			// then don't bother to do the expensive regex checks

		} else if( data = new RegExp( $$.style.types.data.regex ).exec( value ) ){
			return {
				name: name,
				value: data,
				strValue: value,
				mapped: $$.style.types.data,
				field: data[1],
				bypass: propIsBypass
			};

		} else if( mapData = new RegExp( $$.style.types.mapData.regex ).exec( value ) ){
			// we can map only if the type is a colour or a number
			if( !(type.color || type.number) ){ return false; }

			var valueMin = this.parse( name, mapData[4]); // parse to validate
			if( !valueMin || valueMin.mapped ){ return false; } // can't be invalid or mapped

			var valueMax = this.parse( name, mapData[5]); // parse to validate
			if( !valueMax || valueMax.mapped ){ return false; } // can't be invalid or mapped

			// check if valueMin and valueMax are the same
			if( valueMin.value === valueMax.value ){
				return false; // can't make much of a mapper without a range
			
			} else if( type.color ){
				var c1 = valueMin.value;
				var c2 = valueMax.value;
				
				var same = c1[0] === c2[0] // red
					&& c1[1] === c2[1] // green
					&& c1[2] === c2[2] // blue
					&& ( // optional alpha
						c1[3] === c2[3] // same alpha outright
						|| (
							(c1[3] == null || c1[3] === 1) // full opacity for colour 1?
							&&
							(c2[3] == null || c2[3] === 1) // full opacity for colour 2?
						)
					)
				;

				if( same ){ return false; } // can't make a mapper without a range
			}

			return {
				name: name,
				value: mapData,
				strValue: value,
				mapped: $$.style.types.mapData,
				field: mapData[1],
				fieldMin: parseFloat( mapData[2] ), // min & max are numeric
				fieldMax: parseFloat( mapData[3] ),
				valueMin: valueMin.value,
				valueMax: valueMax.value,
				bypass: propIsBypass
			};
		}

		// TODO check if value is inherited (i.e. "inherit")

		// check the type and return the appropriate object
		if( type.number ){
			var units;
			if( !type.unitless ){
				if( valueIsString ){
					var match = value.match( "^(" + $$.util.regex.number + ")(px|em)?" + "$" );
					if( !match ){ return null; } // no match => not a number

					value = match[1];
					units = match[2] || "px";
				} else {
					units = "px"; // implicitly px if unspecified
				}
			}

			value = parseFloat( value );

			// check if value must be an integer
			if( type.integer && !$$.is.integer(value) ){
				return null;
			}

			// check value is within range
			if( (type.min !== undefined && value < type.min) 
			|| (type.max !== undefined && value > type.max)
			){
				return null;
			}

			var ret = {
				name: name,
				value: value,
				strValue: "" + value + (units ? units : ""),
				units: units,
				bypass: propIsBypass,
				pxValue: type.unitless ?
					undefined
					:
					( units === "px" || !units ? (value) : (this.getEmSizeInPixels() * value) )
			};

			return ret;

		} else if( type.color ){
			var tuple = $$.util.color2tuple( value );

			return {
				name: name,
				value: tuple,
				strValue: value,
				bypass: propIsBypass
			};

		} else if( type.enums ){
			for( var i = 0; i < type.enums.length; i++ ){
				var en = type.enums[i];

				if( en === value ){
					return {
						name: name,
						value: value,
						strValue: value,
						bypass: propIsBypass
					};
				}
			}

		} else if( type.regex ){
			var regex = new RegExp( type.regex ); // make a regex from the type
			var m = regex.exec( value );

			if( m ){ // regex matches
				return {
					name: name,
					value: m,
					strValue: value,
					bypass: propIsBypass
				};
			} else { // regex doesn't match
				return null; // didn't match the regex so the value is bogus
			}

		} else if( type.string ){
			// just return
			return {
				name: name,
				value: value,
				strValue: value,
				bypass: propIsBypass
			};

		} else {
			return null; // not a type we can handle
		}

	};

	// gets what an em size corresponds to in pixels relative to a dom element
	$$.styfn.getEmSizeInPixels = function(){
		var cy = this._private.cy;
		var domElement = cy.container();
		domElement = domElement[0] || domElement; // in case we have a jQuery obj

		if( window && domElement ){
			var pxAsStr = window.getComputedStyle(domElement).getPropertyValue("font-size");
			var px = parseFloat( pxAsStr );
			return px;
		} else {
			return 1; // in case we're running outside of the browser
		}
	};

	// gets css property from the core container
	$$.styfn.containerCss = function( propName ){
		var cy = this._private.cy;
		var domElement = cy.container();
		domElement = domElement[0] || domElement; // in case we have a jQuery obj

		if( window && domElement ){
			return window.getComputedStyle(domElement).getPropertyValue( propName );
		}
	};

	$$.styfn.containerProperty = function( propName ){
		var propStr = this.containerCss( propName );
		var prop = this.parse( propName, propStr );
		return prop;
	};

	$$.styfn.containerPropertyAsString = function( propName ){
		var prop = this.containerProperty( propName );

		if( prop ){
			return prop.strValue;
		}
	};

	// create a new context from the specified selector string and switch to that context
	$$.styfn.selector = function( selectorStr ){
		// "core" is a special case and does not need a selector
		var selector = selectorStr === "core" ? null : new $$.Selector( selectorStr );

		var i = this.length++; // new context means new index
		this[i] = {
			selector: selector,
			properties: []
		};

		return this; // chaining
	};

	// add one or many css rules to the current context
	$$.styfn.css = function(){
		var args = arguments;

		switch( args.length ){
		case 1:
			var map = args[0];

			for( var i = 0; i < $$.style.properties.length; i++ ){
				var prop = $$.style.properties[i];
				var mapVal = map[ prop.name ];

				if( mapVal === undefined ){
					mapVal = map[ $$.util.dash2camel(prop.name) ];
				}

				if( mapVal !== undefined ){
					this.cssRule( prop.name, mapVal );
				}
			}

			break;

		case 2:
			this.cssRule( args[0], args[1] );
			break;

		default:
			break; // do nothing if args are invalid
		}

		return this; // chaining
	};

	// add a single css rule to the current context
	$$.styfn.cssRule = function( name, value ){
		// name-value pair
		var property = this.parse( name, value );

		// add property to current context if valid
		if( property ){
			var i = this.length - 1;
			this[i].properties.push( property );

			// add to core style if necessary
			var currentSelectorIsCore = !this[i].selector;
			if( currentSelectorIsCore ){
				this._private.coreStyle[ property.name ] = property;
			}
		}

		return this; // chaining
	};

	// apply a property to the style (for internal use)
	// returns whether application was successful
	//
	// now, this function flattens the property, and here's how:
	//
	// for parsedProp:{ bypass: true, deleteBypass: true }
	// no property is generated, instead the bypass property in the
	// element's style is replaced by what's pointed to by the `bypassed`
	// field in the bypass property (i.e. restoring the property the
	// bypass was overriding)
	//
	// for parsedProp:{ mapped: truthy }
	// the generated flattenedProp:{ mapping: prop }
	// 
	// for parsedProp:{ bypass: true }
	// the generated flattenedProp:{ bypassed: parsedProp } 
	$$.styfn.applyParsedProperty = function( ele, parsedProp ){
		var prop = parsedProp;
		var style = ele._private.style;
		var fieldVal, flatProp;
		var type = $$.style.properties[ prop.name ].type;
		var propIsBypass = prop.bypass;
		var origProp = style[ prop.name ];
		var origPropIsBypass = origProp && origProp.bypass;

		// check if we need to delete the current bypass
		if( propIsBypass && prop.deleteBypass ){ // then this property is just here to indicate we need to delete
			var currentProp = style[ prop.name ];

			// can only delete if the current prop is a bypass and it points to the property it was overriding
			if( !currentProp ){
				return true; // property is already not defined
			} else if( currentProp.bypass && currentProp.bypassed ){ // then replace the bypass property with the original
				
				// because the bypassed property was already applied (and therefore parsed), we can just replace it (no reapplying necessary)
				style[ prop.name ] = currentProp.bypassed;
				return true;
			
			} else {
				return false; // we're unsuccessful deleting the bypass
			}
		}

		// put the property in the style objects
		switch( prop.mapped ){ // flatten the property if mapped
		case $$.style.types.mapData:
			fieldVal = ele._private.data[ prop.field ];
			if( !$$.is.number(fieldVal) ){ return false; } // it had better be a number

			var percent = (fieldVal - prop.fieldMin) / (prop.fieldMax - prop.fieldMin);

			if( type.color ){
				var r1 = prop.valueMin[0];
				var r2 = prop.valueMax[0];
				var g1 = prop.valueMin[1];
				var g2 = prop.valueMax[1];
				var b1 = prop.valueMin[2];
				var b2 = prop.valueMax[2];
				var a1 = prop.valueMin[3] == null ? 1 : prop.valueMin[3];
				var a2 = prop.valueMax[3] == null ? 1 : prop.valueMax[3];

				var clr = [
					Math.round( r1 + (r2 - r1)*percent ),
					Math.round( g1 + (g2 - g1)*percent ),
					Math.round( b1 + (b2 - b1)*percent ),
					Math.round( a1 + (a2 - a1)*percent )
				];

				flatProp = { // colours are simple, so just create the flat property instead of expensive string parsing
					bypass: prop.bypass, // we're a bypass if the mapping property is a bypass
					name: prop.name,
					value: clr,
					strValue: [ "rgba(", clr[0], ", ", clr[1], ", ", clr[2], ", ", clr[3] , ")" ].join("") // fake it til you make it
				};
			
			} else if( type.number ){
				var calcValue = prop.valueMin + (prop.valueMax - prop.valueMin) * percent;
				flatProp = this.parse( prop.name, calcValue, prop.bypass );
			
			} else {
				return false; // can only map to colours and numbers
			}

			if( !flatProp ){ return false; } // don't apply if invalid

			flatProp.mapping = prop; // keep a reference to the mapping
			prop = flatProp; // the flattened (mapped) property is the one we want

			break;

		case $$.style.types.data: // direct mapping
			fieldVal = ele._private.data[ prop.field ];

			flatProp = this.parse( prop.name, fieldVal, prop.bypass );
			if( !flatProp ){ return false; } // don't apply property if the field isn't a valid prop val

			flatProp.mapping = prop; // keep a reference to the mapping
			prop = flatProp; // the flattened (mapped) property is the one we want
			break;

		case undefined:
			break; // just set the property

		default: 
			return false; // danger, will robinson
		}

		// if the property is a bypass property, then link the resultant property to the original one
		if( propIsBypass ){
			if( origPropIsBypass ){ // then this bypass overrides the existing one
				prop.bypassed = origProp.bypassed; // steal bypassed prop from old bypass
			} else { // then link the orig prop to the new bypass
				prop.bypassed = origProp;
			}

			style[ prop.name ] = prop; // and set
		
		} else { // prop is not bypass
			if( origPropIsBypass ){ // then keep the orig prop (since it's a bypass) and link to the new prop
				origProp.bypassed = prop;
			} else { // then just replace the old prop with the new one
				style[ prop.name ] = prop; 
			}
		}

		return true;
	};

	// parse a property and then apply it
	$$.styfn.applyProperty = function( ele, name, value ){
		var parsedProp = this.parse(name, value);
		if( !parsedProp ){ return false; } // can't apply if we can't parse

		return this.applyParsedProperty( ele, parsedProp );
	};

	// (potentially expensive calculation)
	// apply the style to the element based on
	// - its bypass
	// - what selectors match it
	$$.styfn.apply = function( eles ){
		for( var ie = 0; ie < eles.length; ie++ ){
			var ele = eles[ie];

			// apply the styles
			for( var i = 0; i < this.length; i++ ){
				var context = this[i];
				var contextSelectorMatches = context.selector && context.selector.filter( ele ).length > 0; // NB: context.selector may be null for "core"
				var props = context.properties;

				if( contextSelectorMatches ){ // then apply its properties
					for( var j = 0; j < props.length; j++ ){ // for each prop
						var prop = props[j];
						this.applyParsedProperty( ele, prop );
					}
				}
			} // for context

		} // for elements
	};

	// updates the visual style for all elements (useful for manual style modification after init)
	$$.styfn.update = function(){
		var cy = this._private.cy;
		var eles = cy.elements();

		eles.updateStyle();
	};

	// gets the rendered style for an element
	$$.styfn.getRenderedStyle = function( ele ){
		var ele = ele[0]; // insure it's an element

		if( ele ){
			var rstyle = {};
			var style = ele._private.style;
			var cy = this._private.cy;
			var zoom = cy.zoom();

			for( var i = 0; i < $$.style.properties.length; i++ ){
				var prop = $$.style.properties[i];
				var styleProp = style[ prop.name ];

				if( styleProp ){
					var val = styleProp.unitless ? styleProp.strValue : (styleProp.pxValue * zoom) + "px";
					rstyle[ prop.name ] = val;
					rstyle[ $$.util.dash2camel(prop.name) ] = val;
				}
			}

			return rstyle;
		}
	};

	// gets the raw style for an element
	$$.styfn.getRawStyle = function( ele ){
		var ele = ele[0]; // insure it's an element

		if( ele ){
			var rstyle = {};
			var style = ele._private.style;

			for( var i = 0; i < $$.style.properties.length; i++ ){
				var prop = $$.style.properties[i];
				var styleProp = style[ prop.name ];

				if( styleProp ){
					rstyle[ prop.name ] = styleProp.strValue;
					rstyle[ $$.util.dash2camel(prop.name) ] = styleProp.strValue;
				}
			}

			return rstyle;
		}
	};

	// just update the functional properties (i.e. mappings) in the elements'
	// styles (less expensive than recalculation)
	$$.styfn.updateFunctionalProperties = function( eles ){
		for( var i = 0; i < eles.length; i++ ){ // for each ele
			var ele = eles[i];
			var style = ele._private.style;

			for( var j = 0; j < $$.style.properties.length; j++ ){ // for each prop
				var prop = $$.style.properties[j];
				var propInStyle = style[ prop.name ];

				if( propInStyle && propInStyle.mapping ){
					var mapping = propInStyle.mapping;
					this.applyParsedProperty( ele, mapping ); // reapply the mapping property
				}
			}
		}
	};

	// bypasses are applied to an existing style on an element, and just tacked on temporarily
	// returns true iff application was successful for at least 1 specified property
	$$.styfn.applyBypass = function( eles, name, value ){
		var props = [];

		// put all the properties (can specify one or many) in an array after parsing them
		if( name === "*" || name === "**" ){ // apply to all property names

			if( value !== undefined ){
				for( var i = 0; i < $$.style.properties.length; i++ ){
					var prop = $$.style.properties[i];
					var name = prop.name;

					var parsedProp = this.parse(name, value, true);
					
					if( parsedProp ){
						props.push( parsedProp );
					}
				}
			}

		} else if( $$.is.string(name) ){ // then parse the single property
			var parsedProp = this.parse(name, value, true);

			if( parsedProp ){
				props.push( parsedProp );
			}
		} else if( $$.is.plainObject(name) ){ // then parse each property
			var specifiedProps = name;

			for( var i = 0; i < $$.style.properties.length; i++ ){
				var prop = $$.style.properties[i];
				var name = prop.name;
				var value = specifiedProps[ name ];

				if( value === undefined ){ // try camel case name too
					value = specifiedProps[ $$.util.dash2camel(name) ];
				}

				if( value !== undefined ){
					var parsedProp = this.parse(name, value, true);
					
					if( parsedProp ){
						props.push( parsedProp );
					}
				}
			}
		} else { // can't do anything without well defined properties
			return false;
		}

		// we've failed if there are no valid properties
		if( props.length === 0 ){ return false; }

		// now, apply the bypass properties on the elements
		var ret = false; // return true if at least one succesful bypass applied
		for( var i = 0; i < eles.length; i++ ){ // for each ele
			var ele = eles[i];

			for( var j = 0; j < props.length; j++ ){ // for each prop
				var prop = props[j];

				ret = this.applyParsedProperty( ele, prop ) || ret;
			}
		}

		return ret;
	};
	
})(jQuery, jQuery.cytoscape);

;(function($, $$){
	
	$$.fn.core = function( fnMap, options ){
		for( var name in fnMap ){
			var fn = fnMap[name];
			$$.Core.prototype[ name ] = fn;
		}
	};
	
	$$.Core = function( opts ){
		if( !(this instanceof $$.Core) ){
			return new $$.Core(opts);
		}

		var cy = this;
		
		var defaults = {
			layout: {
				name: "grid"
			},
			renderer: {
				name: "svg"
			},
			style: { // actual default style later specified by renderer
			}
		};
		
		var options = $.extend(true, {}, defaults, opts);
		
		if( options.container == null ){
			$.error("Cytoscape.js must be called on an element; specify `container` in options or call on selector directly with jQuery, e.g. $('#foo').cy({...});");
			return;
		} else if( $(options.container).size() > 1 ){
			$.error("Cytoscape.js can not be called on multiple elements in the functional call style; use the jQuery selector style instead, e.g. $('.foo').cy({...});");
			return;
		}
		
		this._private = {
			options: options, // cached options
			elements: [], // array of elements
			id2index: {}, // element id => index in elements array
			listeners: [], // list of listeners
			animation: { 
				// normally shouldn't use collections here, but animation is not related
				// to the functioning of Selectors, so it's ok
				elements: null // elements queued or currently animated
			},
			scratch: {}, // scratch object for core
			layout: null,
			renderer: null,
			notificationsEnabled: true, // whether notifications are sent to the renderer
			zoomEnabled: true,
			panEnabled: true,
			zoom: 1,
			pan: { x: 0, y: 0 }
		};

		// init style
		this._private.style = $$.is.stylesheet(options.style) ? options.style.generateStyle(this) : new $$.Style( cy );

		cy.initRenderer( options.renderer );

		// initial load
		cy.load(options.elements, function(){ // onready
			var data = cy.container().data("cytoscape");
			
			if( data == null ){
				data = {};
			}
			data.cy = cy;
			data.ready = true;
			
			if( data.readies != null ){
				$.each(data.readies, function(i, ready){
					cy.bind("ready", ready);
				});
				
				data.readies = [];
			}
			
			$(options.container).data("cytoscape", data);
			
			cy.startAnimationLoop();
			
			if( $$.is.fn( options.ready ) ){
				options.ready.apply(cy, [cy]);
			}
			
			cy.trigger("ready");
		}, options.done);
	};

	$$.corefn = $$.Core.prototype; // short alias
	

	$$.fn.core({
		getElementById: function( id ){
			var index = this._private.id2index[ id ];
			if( index !== undefined ){
				return this._private.elements[ index ];
			}

			// worst case, return an empty collection
			return new $$.Collection( this );
		},

		addToPool: function( eles ){
			var elements = this._private.elements;
			var id2index = this._private.id2index;

			for( var i = 0; i < eles.length; i++ ){
				var ele = eles[i];

				var id = ele._private.data.id;
				var index = id2index[ id ];
				var alreadyInPool = index !== undefined;

				if( !alreadyInPool ){
					index = elements.length;
					elements.push( ele )
					id2index[ id ] = index;
				}
			}

			return this; // chaining
		},

		removeFromPool: function( eles ){
			var elements = this._private.elements;
			var id2index = this._private.id2index;

			for( var i = 0; i < eles.length; i++ ){
				var ele = eles[i];

				var id = ele._private.data.id;
				var index = id2index[ id ];
				var inPool = index !== undefined;

				if( inPool ){
					delete this._private.id2index[ id ];
					elements.splice(index, 1);

					// adjust the index of all elements past this index
					for( var j = index; j < elements.length; j++ ){
						var jid = elements[j]._private.data.id;
						id2index[ jid ]--;
					}
				}
			}
		},

		container: function(){
			return $( this._private.options.container );
		},

		options: function(){
			return $$.util.copy( this._private.options );
		},
		
		json: function(params){
			var json = {};
			var cy = this;
			
			json.elements = {};
			cy.elements().each(function(i, ele){
				var group = ele.group();
				
				if( json.elements[group] == null ){
					json.elements[group] = [];
				}
				
				json.elements[group].push( ele.json() );
			});

			json.style = cy.style();
			json.scratch = $$.util.copy( cy.scratch() );
			json.zoomEnabled = cy._private.zoomEnabled;
			json.panEnabled = cy._private.panEnabled;
			json.layout = $$.util.copy( cy._private.options.layout );
			json.renderer = $$.util.copy( cy._private.options.renderer );
			
			return json;
		}
		
	});	
	
})(jQuery, jQuery.cytoscape);

(function($, $$){
	
	$$.fn.core({
		add: function(opts){
			
			var elements;
			var cy = this;
			
			// add the elements
			if( $$.is.elementOrCollection(opts) ){
				var eles = opts;
				var jsons = [];

				for( var i = 0; i < eles.length; i++ ){
					var ele = eles[i];
					jsons.push( ele.json() );
				}

				elements = new $$.Collection( cy, jsons );
			}
			
			// specify an array of options
			else if( $$.is.array(opts) ){
				var jsons = opts;

				elements = new $$.Collection(cy, jsons);
			}
			
			// specify via opts.nodes and opts.edges
			else if( $$.is.plainObject(opts) && ($$.is.array(opts.nodes) || $$.is.array(opts.edges)) ){
				var elesByGroup = opts;
				var jsons = [];

				var grs = ["nodes", "edges"];
				for( var i = 0, il = grs.length; i < il; i++ ){
					var group = grs[i];
					var elesArray = elesByGroup[group];

					if( $$.is.array(elesArray) ){

						for( var j = 0, jl = elesArray.length; j < jl; j++ ){
							var json = elesArray[j];

							var mjson = $.extend({}, json, { group: group });
							jsons.push( mjson );
						}
					} 
				}

				elements = new $$.Collection(cy, jsons);
			}
			
			// specify options for one element
			else {
				var json = opts;
				elements = (new $$.Element( cy, json )).collection();
			}
			
			return elements.filter(function(){
				return !this.removed();
			});
		},
		
		remove: function(collection){
			if( !$$.is.elementOrCollection(collection) ){
				collection = collection;
			} else if( $$.is.string(collection) ){
				var selector = collection;
				collection = this.$( selector );
			}
			
			return collection.remove();
		},
		
		load: function(elements, onload, ondone){
			var cy = this;
			
			// remove old elements
			var oldEles = cy.elements();
			if( oldEles.length > 0 ){
				oldEles.remove();
			}

			cy.notifications(false);
			
			var processedElements = [];

			if( elements != null ){
				if( $$.is.plainObject(elements) || $$.is.array(elements) ){
					cy.add( elements );
				} 
			}
			
			function callback(){				
				cy.one("layoutready", function(e){
					cy.notifications(true);
					cy.trigger(e); // we missed this event by turning notifications off, so pass it on

					cy.notify({
						type: "load",
						collection: cy.elements(),
						style: cy._private.style
					});

					cy.one("load", onload);
					cy.trigger("load");
				}).one("layoutstop", function(){
					cy.one("done", ondone);
					cy.trigger("done");
				});
				
				cy.layout( cy._private.options.layout );

			}

			// TODO remove timeout when chrome reports dimensions onload properly
			// only affects when loading the html from localhost, i think...
			if( window.chrome ){
				setTimeout(function(){
					callback();
				}, 30);
			} else {
				callback();
			}

			return this;
		}
	});
	
})(jQuery, jQuery.cytoscape);

;(function($, $$){
	
	$$.fn.core({
		
		startAnimationLoop: function(){
			var cy = this;
			var structs = this._private;
			var stepDelay = 10;
			var useTimeout = false;
			var useRequestAnimationFrame = true;
			
			// initialise the list
			structs.animation.elements = new $$.Collection( cy );
			
			// TODO change this when standardised
			var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame ||  
				window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
			
			if( requestAnimationFrame == null || !useRequestAnimationFrame ){
				requestAnimationFrame = function(fn){
					window.setTimeout(function(){
						fn(+new Date);
					}, stepDelay);
				};
			}
			
			var containerDom = cy.container()[0];
			
			function globalAnimationStep(){
				function exec(){
					requestAnimationFrame(function(now){
						handleElements(now);
						globalAnimationStep();
					}, containerDom);
				}
				
				if( useTimeout ){
					setTimeout(function(){
						exec();
					}, stepDelay);
				} else {
					exec();
				}
			}
			
			globalAnimationStep(); // first call
			
			function handleElements(now){
				
				structs.animation.elements.each(function(i, ele){
					
					// we might have errors if we edit animation.queue and animation.current
					// for ele (i.e. by stopping)
					try{
						ele = ele.element(); // make sure we've actually got a Element
						var current = ele._private.animation.current;
						var queue = ele._private.animation.queue;
						
						// if nothing currently animating, get something from the queue
						if( current.length == 0 ){
							var q = queue;
							var next = q.length > 0 ? q.shift() : null;
							
							if( next != null ){
								next.callTime = +new Date; // was queued, so update call time
								current.push( next );
							}
						}
						
						// step and remove if done
						var completes = [];
						for(var i = 0; i < current.length; i++){
							var ani = current[i];
							step( ele, ani, now );

							if( current[i].done ){
								completes.push( ani );
								
								// remove current[i]
								current.splice(i, 1);
								i--;
							}
						}
						
						// call complete callbacks
						$.each(completes, function(i, ani){
							var complete = ani.params.complete;

							if( $$.is.fn(complete) ){
								complete.apply( ele, [ now ] );
							}
						});
						
					} catch(e){
						// do nothing
					}
					
				}); // each element
				
				
				// notify renderer
				if( structs.animation.elements.size() > 0 ){
					cy.notify({
						type: "draw",
						collection: structs.animation.elements
					});
				}
				
				// remove elements from list of currently animating if its queues are empty
				structs.animation.elements = structs.animation.elements.filter(function(){
					var ele = this;
					var queue = ele._private.animation.queue;
					var current = ele._private.animation.current;
					
					return current.length > 0 || queue.length > 0;
				});
			} // handleElements
				
			function step( self, animation, now ){
				var properties = animation.properties;
				var params = animation.params;
				var startTime = animation.callTime;
				var percent;
				
				if( params.duration == 0 ){
					percent = 1;
				} else {
					percent = Math.min(1, (now - startTime)/params.duration);
				}
				
				function update(p){
					if( p.end != null ){
						var start = p.start;
						var end = p.end;
						
						// for each field in end, update the current value
						$.each(end, function(name, val){
							if( valid(start[name], end[name]) ){
								self._private[p.field][name] = ease( start[name], end[name], percent );
							}
						});					
					}
				}
				
				if( properties.delay == null ){
					update({
						end: properties.position,
						start: animation.startPosition,
						field: "position"
					});
					
					update({
						end: properties.bypass,
						start: animation.startStyle,
						field: "bypass"
					});
				}
				
				if( $$.is.fn(params.step) ){
					params.step.apply( self, [ now ] );
				}
				
				if( percent >= 1 ){
					animation.done = true;
				}
				
				return percent;
			}
			
			function valid(start, end){
				if( start == null || end == null ){
					return false;
				}
				
				if( $$.is.number(start) && $$.is.number(end) ){
					return true;
				} else if( (start) && (end) ){
					return true;
				}
				
				return false;
			}
			
			function ease(start, end, percent){
				if( $$.is.number(start) && $$.is.number(end) ){
					return start + (end - start) * percent;
				} else if( (start) && (end) ){
					var c1 = $.Color(start).fix().toRGB();
					var c2 = $.Color(end).fix().toRGB();

					function ch(ch1, ch2){
						var diff = ch2 - ch1;
						var min = ch1;
						return Math.round( percent * diff + min );
					}
					
					var r = ch( c1.red(), c2.red() );
					var g = ch( c1.green(), c2.green() );
					var b = ch( c1.blue(), c2.blue() );
					
					return $.Color([r, g, b], "RGB").toHEX().toString();
				}
				
				return undefined;
			}
			
		}
		
	});
	
})(jQuery, jQuery.cytoscape);


	
		

;(function($, $$){
	
	$$.fn.core({
		data: $$.define.data({
			field: "data",
			bindingEvent: "data",
			allowBinding: true,
			allowSetting: true,
			settingEvent: "data",
			settingTriggersEvent: true,
			triggerFnName: "trigger",
			allowGetting: true
		}),

		removeData: $$.define.removeData({
			field: "data",
			event: "data",
			triggerFnName: "trigger",
			triggerEvent: true
		}),

		scratch: $$.define.data({
			field: "scratch",
			allowBinding: false,
			allowSetting: true,
			settingTriggersEvent: false,
			allowGetting: true
		}),

		removeScratch: $$.define.removeData({
			field: "scratch",
			triggerEvent: false
		}),
	});
	
})(jQuery, jQuery.cytoscape);

;(function($, $$){

	$$.fn.core({
		on: $$.define.on(), // .on( events [, selector] [, data], handler)
		one: $$.define.on({ unbindSelfOnTrigger: true }),
		once: $$.define.on({ unbindAllBindersOnTrigger: true }),
		off: $$.define.off(), // .off( events [, selector] [, handler] )
		trigger: $$.define.trigger(), // .trigger( events [, extraParams] )
	});

	// aliases for those folks who like old stuff:
	$$.corefn.bind = $$.corefn.on;
	$$.corefn.unbind = $$.corefn.off;

	// add event aliases like .click()
	$$.define.event.aliasesOn( $$.corefn );
		
})(jQuery, jQuery.cytoscape);

;(function($, $$){
	
	$$.fn.core({
		
		layout: function( params ){
			var cy = this;
			
			// if no params, use the previous ones
			if( params == null ){
				params = this._private.options.layout;
			}
			
			this.initLayout( params );
			
			cy.trigger("layoutstart");
			
			this._private.layout.run();
			
			return this;
			
		},
		
		initLayout: function( options ){
			if( options == null ){
				$.error("Layout options must be specified to run a layout");
				return;
			}
			
			if( options.name == null ){
				$.error("A `name` must be specified to run a layout");
				return;
			}
			
			var name = options.name;
			var layoutProto = $$.extension("layout", name);
			
			if( layoutProto == null ){
				$.error("Can not apply layout: No such layout `%s` found; did you include its JS file?", name);
				return;
			}
			
			this._private.layout = new layoutProto( $.extend({}, options, {
				renderer: this._private.renderer,
				cy: this
			}) );
			this._private.options.layout = options; // save options
		}
		
	});
	
})(jQuery, jQuery.cytoscape);

(function($, $$){
	
	$$.fn.core({
		notify: function( params ){
			if( !this._private.notificationsEnabled ){ return; } // exit on disabled
			
			var renderer = this.renderer();
			var cy = this;
			
			// normalise params.collection 
			if( $$.is.element(params.collection) ){ // make collection from element
				var element = params.collection;
				params.collection = new $$.Collection(cy, [ element ]);	
			
			} else if( $$.is.array(params.collection) ){ // make collection from elements array
				var elements = params.collection;
				params.collection = new $$.Collection(cy, elements);	
			} 
			
			renderer.notify(params);
		},
		
		notifications: function( bool ){
			var p = this._private;
			
			if( bool === undefined ){
				return p.notificationsEnabled;
			} else {
				p.notificationsEnabled = bool ? true : false;
			}
		},
		
		noNotifications: function( callback ){
			this.notifications(false);
			callback();
			this.notifications(true);
		}
	});
	
})(jQuery, jQuery.cytoscape);

;(function($, $$){
	
	$$.fn.core({
		
		renderer: function(){
			return this._private.renderer;
		},
		
		initRenderer: function( options ){
			var cy = this;
			
			var rendererProto = $$.extension("renderer", options.name);
			if( rendererProto == null ){
				$.error("Can not initialise: No such renderer `$s` found; did you include its JS file?", options.name);
				return;
			}
			
			this._private.renderer = new rendererProto( $.extend({}, options, {
				cy: cy,
				style: cy._private.style,
				
				styleCalculator: {
					calculate: function(element, styleVal){

						if( $$.is.plainObject(styleVal) ){
							
							var ret;
							
							if( styleVal.customMapper != null ){
								
								ret = styleVal.customMapper.apply( element, [ element.data() ] );
								
							} else if( styleVal.passthroughMapper != null ){
								
								var attrName = styleVal.passthroughMapper;
								ret = element._private.data[attrName];
								
							} else if( styleVal.discreteMapper != null ){
								
								var attrName = styleVal.discreteMapper.attr;
								var entries = styleVal.discreteMapper.mapped;
								var elementVal = element.data(attrName);
								
								$.each(entries, function(attrVal, mappedVal){								
									if( attrVal == elementVal ){
										ret = mappedVal;
									}
								});
								
							} else if( styleVal.continuousMapper != null ){
								
								var map = styleVal.continuousMapper;
								
								if( map.attr.name == null || typeof map.attr.name != typeof "" ){
									$.error("For style.%s.%s, `attr.name` must be defined as a string since it's a continuous mapper", element.group(), styleName);
									return;
								}
								
								var attrBounds = {};
								
								// use defined attr min & max if set in mapper
								if( map.attr.min != null ){
									attrBounds.min = map.attr.min;
								}
								if( map.attr.max != null ){
									attrBounds.max = map.attr.max;
								}
								
								if( attrBounds != null ){
								
									var data = element.data(map.attr.name);
									var percent = ( data - attrBounds.min ) / (attrBounds.max - attrBounds.min);
									
									if( attrBounds.max == attrBounds.min ){
										percent = 1;
									}
									
									if( percent > 1 ){
										percent = 1;
									} else if( percent < 0 || data == null || isNaN(percent) ){
										percent = 0;
									}
									
									if( data == null && styleVal.defaultValue != null ){
										ret = styleVal.defaultValue;
									} else if( $$.is.number(map.mapped.min) && $$.is.number(map.mapped.max) ){
										ret = percent * (map.mapped.max - map.mapped.min) + map.mapped.min;
									} else if( (map.mapped.min) && (map.mapped.max) ){
										
										var cmin = $.Color(map.mapped.min).fix().toRGB();
										var cmax = $.Color(map.mapped.max).fix().toRGB();

										var red = Math.round( cmin.red() * (1 - percent) + cmax.red() * percent );
										var green  = Math.round( cmin.green() * (1 - percent) + cmax.green() * percent );
										var blue  = Math.round( cmin.blue() * (1 - percent) + cmax.blue() * percent );

										ret = $.Color([red, green, blue], "RGB").toHEX().toString();
									} else {
										$.error("Unsupported value used in mapper for `style.%s.%s` with min mapped value `%o` and max `%o` (neither number nor colour)", element.group(), map.styleName, map.mapped.min, map.mapped.max);
										return;
									}
								} else {
									$.error("Attribute values for `%s.%s` must be numeric for continuous mapper `style.%s.%s` (offending %s: `%s`)", element.group(), map.attr.name, element.group(), styleName, element.group(), element.data("id"));
									return;
								}
								
							} // end if
							
							var defaultValue = styleVal.defaultValue;
							if( ret == null ){
								ret = defaultValue;
							}
							
						} else {
							ret = styleVal;
						} // end if
						
						return ret;
					} // end calculate
				} // end styleCalculator
			}) );
			
			
		}
		
	});	
	
})(jQuery, jQuery.cytoscape);

;(function($, $$){
	
	$$.fn.core({

		// get a collection
		// - empty collection on no args
		// - collection of elements in the graph on selector arg
		// - guarantee a returned collection when elements or collection specified
		collection: function( eles ){

			if( $$.is.string(eles) ){
				return this.$( eles );
			} else if( $$.is.elementOrCollection(eles) ){
				return eles.collection();
			}

			return new $$.Collection( this );
		},
		
		nodes: function( selector ){
			var nodes = this.$("node");

			if( selector ){
				return nodes.filter( selector );
			} 

			return nodes;
		},
		
		edges: function( selector ){
			var edges = this.$("edge");

			if( selector ){
				return edges.filter( selector );
			}

			return edges;
		},
			
		// search the graph like jQuery
		$: function( selector ){
			var eles = new $$.Collection( this, this._private.elements );

			if( selector ){
				return eles.filter( selector );
			}

			return eles;
		}
		
	});	

	// aliases
	$$.corefn.elements = $$.corefn.filter = $$.corefn.$;	
	
})(jQuery, jQuery.cytoscape);

;(function($, $$){
	
	$$.fn.core({
		
		style: function(val){
			return this._private.style;
		}
	});
	
})(jQuery, jQuery.cytoscape);


;(function($, $$){
	
	$$.fn.core({
		
		panningEnabled: function( bool ){
			if( bool !== undefined ){
				this._private.panEnabled = bool ? true : false;
			} else {
				return this._private.panEnabled;
			}
			
			return this; // chaining
		},
		
		zoomingEnabled: function( bool ){
			if( bool !== undefined ){
				this._private.zoomEnabled = bool ? true : false;
			} else {
				return this._private.zoomEnabled;
			}
			
			return this; // chaining
		},
		
		pan: function(){
			var args = arguments;
			var pan = this._private.pan;
			var dim, val, dims, x, y;

			switch( args.length ){
			case 0: // .pan()
				return pan;

			case 1: 

				if( $$.is.string( args[0] ) ){ // .pan("x")
					dim = args[0];
					return pan[ dim ];

				} else if( $$.is.plainObject( args[0] ) ) { // .pan({ x: 0, y: 100 })
					dims = args[0];
					x = dims.x;
					y = dims.y;

					if( $$.is.number(x) ){
						pan.x = x;
					}

					if( $$.is.number(y) ){
						pan.y = y;
					}

					this.trigger("pan");
				}
				break;

			case 2: // .pan("x", 100)
				dim = args[0];
				val = args[1];

				if( (dim === "x" || dim === "y") && $$.is.number(val) ){
					pan[dim] = val;
				}

				this.trigger("pan");
				break;

			default:
				break; // invalid
			}

			this.notify({ // notify the renderer that the viewport changed
				type: "viewport"
			});

			return this; // chaining
		},
		
		panBy: function(params){
			var args = arguments;
			var pan = this._private.pan;
			var dim, val, dims, x, y;

			switch( args.length ){
			case 1: 

				if( $$.is.plainObject( args[0] ) ) { // .panBy({ x: 0, y: 100 })
					dims = args[0];
					x = dims.x;
					y = dims.y;

					if( $$.is.number(x) ){
						pan.x += x;
					}

					if( $$.is.number(y) ){
						pan.y += y;
					}

					this.trigger("pan");
				}
				break;

			case 2: // .panBy("x", 100)
				dim = args[0];
				val = args[1];

				if( (dim === "x" || dim === "y") && $$.is.number(val) ){
					pan[dim] += val;
				}

				this.trigger("pan");
				break;

			default:
				break; // invalid
			}

			this.notify({ // notify the renderer that the viewport changed
				type: "viewport"
			});

			return this; // chaining
		},
		
		fit: function( elements ){
			var bb = this.boundingBox( elements );
			var style = this.style();

			var w = parseFloat( style.containerCss("width") );
			var h = parseFloat( style.containerCss("height") );
			var zoom;

			if( !isNaN(w) && !isNaN(h) ){
				zoom = this._private.zoom = Math.min( w/bb.w, h/bb.h );

				this.pan({ // now pan to middle
					x: (w - zoom*( bb.x1 + bb.x2 ))/2,
					y: (h - zoom*( bb.y1 + bb.y2 ))/2
				});
			}

			this.trigger("pan zoom");

			this.notify({ // notify the renderer that the viewport changed
				type: "viewport"
			});

			return this; // chaining
		},
		
		zoom: function( params ){
			var pos;
			var zoom;

			if( params === undefined ){ // then get the zoom
				return this._private.zoom;

			} else if( $$.is.number(params) ){ // then set the zoom
				zoom = params;
				pos = {
					x: 0,
					y: 0
				};

			} else if( $$.is.plainObject(params) ){ // then zoom about a point
				zoom = params.level;

				if( params.renderedPosition ){
					var rpos = params.renderedPosition;
					var p = this._private.pan;
					var z = this._private.zoom;

					pos = {
						x: (rpos.x - p.x)/z,
						y: (rpos.y - p.y)/z
					};
				} else if( params.position ){
					pos = params.position;
				}
			}

			if( !$$.is.number(zoom) || !$$.is.number(pos.x) || !$$.is.number(pos.y) ){
				return this; // can't zoom with invalid params
			}

			var pan1 = this._private.pan;
			var zoom1 = this._private.zoom;
			var zoom2 = zoom;
			
			var pan2 = {
				x: -zoom2/zoom1 * (pos.x - pan1.x) + pos.x,
				y: -zoom2/zoom1 * (pos.y - pan1.y) + pos.y
			};

			this._private.zoom = zoom;
			this._private.pan = pan2;

			var posChanged = pan1.x !== pan2.x || pan1.y !== pan2.y;
			this.trigger("zoom" + (posChanged ? " pan" : "") );

			this.notify({ // notify the renderer that the viewport changed
				type: "viewport"
			});

			return this; // chaining
		},
		
		// get the bounding box of the elements (in raw model position)
		boundingBox: function( selector ){
			var eles;

			if( !selector || ( $$.is.elementOrCollection(selector) && selector.length === 0 ) ){
				eles = this.$();
			} else if( $$.is.string(selector) ){
				eles = this.$( selector );
			} else if( $$.is.elementOrCollection(selector) ){
				eles = selector;
			}

			var x1 = Infinity;
			var x2 = -Infinity;
			var y1 = Infinity;
			var y2 = -Infinity;

			// find bounds of elements
			for( var i = 0; i < eles.length; i++ ){
				var ele = eles[i];

				if( ele.isNode() ){
					var pos = ele._private.position;
					var x = pos.x;
					var y = pos.y;
					var w = ele.outerWidth();
					var halfW = w/2;
					var h = ele.outerHeight();
					var halfH = h/2;

					var ex1 = x - halfW;
					var ex2 = x + halfW;
					var ey1 = y - halfH;
					var ey2 = y + halfH;

					x1 = ex1 < x1 ? ex1 : x1;
					x2 = ex2 > x2 ? ex2 : x2;
					y1 = ey1 < y1 ? ey1 : y1;
					y2 = ey2 > y2 ? ey2 : y2;
				}
			}

			return {
				x1: x1,
				x2: x2,
				y1: y1,
				y2: y2,
				w: x2 - x1,
				h: y2 - y1
			};
		},

		center: function(elements){
			var bb = this.boundingBox( elements );
			var style = this.style();
			var w = parseFloat( style.containerCss("width") );
			var h = parseFloat( style.containerCss("height") );
			var zoom = this._private.zoom;

			this.pan({ // now pan to middle
				x: (w - zoom*( bb.x1 + bb.x2 ))/2,
				y: (h - zoom*( bb.y1 + bb.y2 ))/2
			});
			
			this.trigger("pan");

			this.notify({ // notify the renderer that the viewport changed
				type: "viewport"
			});

			return this; // chaining
		},
		
		reset: function(){
			this.pan({ x: 0, y: 0 });
			this.zoom(1);
			
			this.trigger("zoom");
			this.trigger("pan");

			this.notify({ // notify the renderer that the viewport changed
				type: "viewport"
			});
			
			return this; // chaining
		}
	});	
	
})(jQuery, jQuery.cytoscape);

;(function($, $$){
	
	// Use this interface to define functions for collections/elements.
	// This interface is good, because it forces you to think in terms
	// of the collections case (more than 1 element), so we don't need
	// notification blocking nonsense everywhere.
	//
	// Other collection-*.js files depend on this being defined first.
	// It's a trade off: It simplifies the code for Collection and 
	// Element integration so much that it's worth it to create the
	// JS dependency.
	//
	// Having this integration guarantees that we can call any
	// collection function on an element and vice versa.
	$$.fn.collection = $$.fn.eles = function( fnMap, options ){
		for( var name in fnMap ){
			var fn = fnMap[name];

			$$.Collection.prototype[ name ] = fn;
		}
	};
	
	// factory for generating edge ids when no id is specified for a new element
	var idFactory = {
		prefix: {
			nodes: "n",
			edges: "e"
		},
		id: {
			nodes: 0,
			edges: 0
		},
		generate: function(cy, element, tryThisId){
			var json = $$.is.element( element ) ? element._private : element;
			var group = json.group;
			var id = tryThisId != null ? tryThisId : this.prefix[group] + this.id[group];
			
			if( cy.getElementById(id).empty() ){
				this.id[group]++; // we've used the current id, so move it up
			} else { // otherwise keep trying successive unused ids
				while( !cy.getElementById(id).empty() ){
					id = this.prefix[group] + ( ++this.id[group] );
				}
			}
			
			return id;
		}
	};
	
	// Element
	////////////////////////////////////////////////////////////////////////////////////////////////////
	
	// represents a node or an edge
	$$.Element = function(cy, params, restore){
		if( !(this instanceof $$.Element) ){
			return new $$.Element(cy, params, restore);
		}

		var self = this;
		restore = (restore === undefined || restore ? true : false);
		
		if( cy === undefined || params === undefined || !$$.is.core(cy) ){
			$$.util.error("An element must have a core reference and parameters set");
			return;
		}
		
		// validate group
		if( params.group !== "nodes" && params.group !== "edges" ){
			$$.util.error("An element must be of type `nodes` or `edges`; you specified `" + params.group + "`");
			return;
		}
		
		// make the element array-like, just like a collection
		this.length = 1;
		this[0] = this;
		
		// NOTE: when something is added here, add also to ele.json()
		this._private = {
			cy: cy,
			single: true, // indicates this is an element
			data: params.data || {}, // data object
			position: params.position || {}, // fields x, y, etc (could be 3d or radial coords; renderer decides)
			listeners: [], // array of bound listeners
			group: params.group, // string; "nodes" or "edges"
			style: {}, // properties as set by the style
			removed: true, // whether it's inside the vis; true if removed (set true here since we call restore)
			selected: params.selected ? true : false, // whether it's selected
			selectable: params.selectable === undefined ? true : ( params.selectable ? true : false ), // whether it's selectable
			locked: params.locked ? true : false, // whether the element is locked (cannot be moved)
			grabbed: false, // whether the element is grabbed by the mouse; renderer sets this privately
			grabbable: params.grabbable === undefined ? true : ( params.grabbable ? true : false ), // whether the element can be grabbed
			classes: {}, // map ( className => true )
			animation: { // object for currently-running animations
				current: [],
				queue: []
			},
			rscratch: {}, // object in which the renderer can store information
			scratch: {}, // scratch objects
			edges: [], // array of connected edges
			children: [] // array of children
		};
		
		// renderedPosition overrides if specified
		if( params.renderedPosition ){
			var rpos = params.renderedPosition;
			var pan = cy.pan();
			var zoom = cy.zoom();

			this._private.position = {
				x: (rpos.x - pan.x)/zoom,
				y: (rpos.y - pan.y)/zoom
			};
		}
		
		if( $$.is.string(params.classes) ){
			var classes = params.classes.split(/\s+/);
			for( var i = 0, l = classes.length; i < l; i++ ){
				var cls = classes[i];
				if( !cls || cls === "" ){ continue; }

				self._private.classes[cls] = true;
			}
		}
		
		if( restore === undefined || restore ){
			this.restore();
		}
		
	};

	
	// Collection
	////////////////////////////////////////////////////////////////////////////////////////////////////
	
	// represents a set of nodes, edges, or both together
	$$.Collection = function(cy, elements){
		if( !(this instanceof $$.Collection) ){
			return new $$.Collection(cy, elements);
		}

		if( cy === undefined || !$$.is.core(cy) ){
			$$.util.error("A collection must have a reference to the core");
			return;
		}
		
		var ids = {};
		var uniqueElements = [];
		var createdElements = false;
		
		if( !elements ){
			elements = [];
		} else if( elements.length > 0 && $$.is.plainObject( elements[0] ) && !$$.is.element( elements[0] ) ){
			createdElements = true;

			// make elements from json and restore all at once later
			var eles = [];
			var elesIds = {};

			for( var i = 0, l = elements.length; i < l; i++ ){
				var json = elements[i];

				if( json.data == null ){
					json.data = {};
				}
				
				var data = json.data;

				// make sure newly created elements have valid ids
				if( data.id == null ){
					data.id = idFactory.generate( cy, json );
				} else if( cy.getElementById( data.id ).length != 0 || elesIds[ data.id ] ){
					continue; // can't create element
				}

				var ele = new $$.Element( cy, json, false );
				eles.push( ele );
				elesIds[ data.id ] = true;
			}

			elements = eles;
		}
		
		for( var i = 0, l = elements.length; i < l; i++ ){
			var element = elements[i];
			if( !element ){	continue; }
			
			var id = element._private.data.id;
			
			if( !ids[ id ] ){
				ids[ id ] = element;
				uniqueElements.push( element );
			}
		}
		
		for(var i = 0, l = uniqueElements.length; i < l; i++){
			this[i] = uniqueElements[i];
		}
		this.length = uniqueElements.length;
		
		this._private = {
			cy: cy,
			ids: ids
		};

		// restore the elements if we created them from json
		if( createdElements ){
			this.restore();
		}
	};
	
	
	// Functions
	////////////////////////////////////////////////////////////////////////////////////////////////////
	
	// keep the prototypes in sync (an element has the same functions as a collection)
	// and use $$.elefn and $$.elesfn as shorthands to the prototypes
	$$.elefn = $$.elesfn = $$.Element.prototype = $$.Collection.prototype;

	$$.elesfn.cy = function(){
		return this._private.cy;
	};
	
	$$.elesfn.element = function(){
		return this[0];
	};
	
	$$.elesfn.collection = function(){
		if( $$.is.collection(this) ){
			return this;
		} else { // an element
			return new $$.Collection( this._private.cy, [this] );
		}
	};

	$$.elesfn.json = function(){
		var ele = this.element();
		if( ele == null ){ return undefined }

		var p = ele._private;
		
		var json = $$.util.copy({
			data: p.data,
			position: p.position,
			group: p.group,
			bypass: p.bypass,
			removed: p.removed,
			selected: p.selected,
			selectable: p.selectable,
			locked: p.locked,
			grabbed: p.grabbed,
			grabbable: p.grabbable,
			classes: "",
			scratch: p.scratch
		});
		
		var classes = [];
		$.each(p.classes, function(cls, bool){
			classes.push(cls);
		});
		
		$.each(classes, function(i, cls){
			json.classes += cls + ( i < classes.length - 1 ? " " : "" );
		});
		
		return json;
	};

	$$.elesfn.restore = function( notifyRenderer ){
		var self = this;
		var restored = [];
		var cy = self.cy();
		
		if( notifyRenderer === undefined ){
			notifyRenderer = true;
		}

		// create arrays of nodes and edges, since we need to
		// restore the nodes first
		var elements = [];
		var numNodes = 0;
		var numEdges = 0;
		for( var i = 0, l = self.length; i < l; i++ ){
			var ele = self[i];
			
			// keep nodes first in the array and edges after
			if( ele.isNode() ){ // put to front of array if node
				elements.unshift( ele );
				numNodes++;
			} else { // put to end of array if edge
				elements.push( ele );
				numEdges++;
			}
		}

		// now, restore each element
		for( var i = 0, l = elements.length; i < l; i++ ){
			var ele = elements[i];

			if( !ele.removed() ){
				// don't need to do anything
				continue;
			}
			
			var _private = ele._private;
			var data = _private.data;
			
			// set id and validate
			if( data.id === undefined ){
				data.id = idFactory.generate( cy, ele );
			} else if( $$.is.emptyString(data.id) || !$$.is.string(data.id) ){
				// can't create element if it has empty string as id or non-string id
				continue;
			} else if( cy.getElementById( data.id ).length != 0 ){
				// can't create element if one already has that id
				continue;
			}

			var id = data.id; // id is finalised, now let's keep a ref
			
			if( ele.isEdge() ){ // extra checks for edges
				
				var edge = ele;
				var fields = ["source", "target"];
				var fieldsLength = fields.length;
				for(var j = 0; j < fieldsLength; j++){
					
					var field = fields[j];
					var val = data[field];
					
					if( val == null || val === "" ){
						// can't create if source or target is not defined properly
						continue;
					} else if( cy.getElementById(val).empty() ){ 
						// can't create edge if one of its nodes doesn't exist
						continue;
					}
				}
				
				var src = cy.getElementById( data.source );
				var tgt = cy.getElementById( data.target );

				src._private.edges.push( edge );
				tgt._private.edges.push( edge );

			} // if is edge
			 
			// create mock ids map for element so it can be used like collections
			_private.ids = {};
			_private.ids[ data.id ] = ele;

			_private.removed = false;
			cy.addToPool( ele );
			
			restored.push( ele );
		} // for each element

		// do compound node sanity checks
		for( var i = 0; i < numNodes; i++ ){ // each node 
			var node = elements[i];
			var data = node._private.data;
			var id = data.id;

			var parentId = node._private.data.parent;
			var specifiedParent = parentId != null;

			if( specifiedParent ){
				var parent = cy.getElementById( parentId );

				if( parent.empty() ){
					// non-existant parent; just remove it
					delete data.parent;
				} else {
					var selfAsParent = false;
					var ancestor = parent;
					while( !ancestor.empty() ){
						if( node.same(ancestor) ){
							// mark self as parent and remove from data
							selfAsParent = true;
							delete data.parent; // remove parent reference

							// exit or we loop forever
							break;
						}

						ancestor = ancestor.parent();
					}

					if( !selfAsParent ){
						// connect with children
						parent[0]._private.children.push( node );
					}
				} // else
			} // if specified parent
		} // for each node
		
		restored = new $$.Collection( cy, restored );
		if( restored.length > 0 ){

			restored.updateStyle( false ); // when we restore/add elements, they need their style
			restored.connectedNodes().updateStyle( notifyRenderer ); // may need to update style b/c of {degree} selectors

			if( notifyRenderer ){
				restored.rtrigger("add");
			} else {
				restored.trigger("add");
			}
		}
		
		return self; // chainability
	};
	
	$$.elesfn.removed = function(){
		var ele = this[0];
		return ele && ele._private.removed;
	};

	$$.elesfn.inside = function(){
		var ele = this[0];
		return ele && !ele._private.removed;
	};

	$$.elesfn.remove = function( notifyRenderer ){
		var self = this;
		var removed = [];
		var elesToRemove = [];
		var elesToRemoveIds = {};
		var cy = self._private.cy;
		
		if( notifyRenderer === undefined ){
			notifyRenderer = true;
		}
		
		// add connected edges
		function addConnectedEdges(node){
			var edges = node._private.edges; 
			for( var i = 0; i < edges.length; i++ ){
				add( edges[i] );
			}
		}
		

		// add descendant nodes
		function addChildren(node){
			var children = node._private.children;
			
			for( var i = 0; i < children.length; i++ ){
				add( children[i] );
			}
		}

		function add( ele ){
			var alreadyAdded =  elesToRemoveIds[ ele.id() ];
			if( alreadyAdded ){
				return;
			} else {
				elesToRemoveIds[ ele.id() ] = true;
			}

			if( ele.isNode() ){
				elesToRemove.push( ele ); // nodes are removed last

				addConnectedEdges( ele );
				addChildren( ele );
			} else {
				elesToRemove.unshift( ele ); // edges are removed first
			}
		}

		// make the list of elements to remove
		// (may be removing more than specified due to connected edges etc)

		for( var i = 0, l = self.length; i < l; i++ ){
			var ele = self[i];

			add( ele );
		}
		
		function removeEdgeRef(node, edge){
			var connectedEdges = node._private.edges;
			for( var j = 0; j < connectedEdges.length; j++ ){
				var connectedEdge = connectedEdges[j];
				
				if( edge === connectedEdge ){
					connectedEdges.splice( j, 1 );
					break;
				}
			}
		}

		for( var i = 0; i < elesToRemove.length; i++ ){
			var ele = elesToRemove[i];

			// mark as removed
			ele._private.removed = true;

			// remove from core pool
			cy.removeFromPool( ele );

			// add to list of removed elements
			removed.push( ele );

			if( ele.isEdge() ){ // remove references to this edge in its connected nodes
				var src = ele.source()[0];
				var tgt = ele.target()[0];

				removeEdgeRef( src, ele );
				removeEdgeRef( src, tgt );
			}
		}
		
		var removedElements = new $$.Collection( this.cy(), removed );
		if( removedElements.size() > 0 ){
			// must manually notify since trigger won't do this automatically once removed
			
			if( notifyRenderer ){
				this.cy().notify({
					type: "remove",
					collection: removedElements
				});
			}
			
			removedElements.trigger("remove");
		}
		
		return this;
	};
	
})(jQuery, jQuery.cytoscape);


;(function($, $$){

	$$.fn.eles({
		animated: function(){
			var ele = this[0];

			if( ele ){
				ele._private.animation.current.length > 0;
			}
		},

		clearQueue: function(){
			for( var i = 0; i < this.length; i++ ){
				var ele = this[i];
				ele._private.animation.queue = [];
			}

			return this;
		},

		delay: function( time, complete ){
			return this.animate({
				delay: time
			}, {
				duration: time,
				complete: complete
			});
		},

		animate: function( properties, params ){
			var callTime = +new Date;
			
			for( var i = 0; i < this.length; i++ ){
				var self = this[i];

				var self = this;
				var pos = self._private.position;
				var startPosition = {
					x: pos.x,
					y: pos.y
				};
				var startStyle = $$.util.copy( self.style() );
				var structs = this.cy()._private; // TODO remove ref to `structs` after refactoring
				
				params = $.extend(true, {}, {
					duration: 400
				}, params);
				
				switch( params.duration ){
				case "slow":
					params.duration = 600;
					break;
				case "fast":
					params.duration = 200;
					break;
				}
				
				if( properties == null || (properties.position == null && properties.bypass == null && properties.delay == null) ){
					return; // nothing to animate
				}
				
				if( self.animated() && (params.queue === undefined || params.queue) ){
					q = self._private.animation.queue;
				} else {
					q = self._private.animation.current;
				}
				
				q.push({
					properties: properties,
					params: params,
					callTime: callTime,
					startPosition: startPosition,
					startStyle: startStyle
				});
				
				structs.animation.elements = structs.animation.elements.add( self );
			}
		}, // animate

		stop: function(clearQueue, jumpToEnd){
			this.each(function(){
				var self = this;
				
				$.each(self._private.animation.current, function(i, animation){				
					if( jumpToEnd ){
						$.each(animation.properties, function(propertyName, property){
							$.each(property, function(field, value){
								self._private[propertyName][field] = value;
							});
						});
					}
				});
				
				self._private.animation.current = [];
				
				if( clearQueue ){
					self._private.animation.queue = [];
				}
			});
			
			// we have to notify (the animation loop doesn't do it for us on `stop`)
			this.cy().notify({
				collection: this,
				type: "draw"
			});
			
			return this;
		}
	});
	
})(jQuery, jQuery.cytoscape);	

;(function($, $$){
	
	$$.fn.eles({
		addClass: function(classes){
			classes = classes.split(/\s+/);
			var self = this;
			
			for( var i = 0; i < classes.length; i++ ){
				var cls = classes[i];
				if( $$.is.emptyString(cls) ){ continue; }
				
				for( var j = 0; j < self.length; j++ ){
					var ele = self[j];
					ele._private.classes[cls] = true;
				}
			}
			
			self.updateStyle().rtrigger("class");
			return self;
		},

		hasClass: function(className){
			var ele = this[0];
			return ele != null && ele._private.classes[className];
		},

		toggleClass: function(classesStr, toggle){
			var classes = classesStr.split(/\s+/);
			var self = this;
			
			for( var i = 0, il = self.length; i < il; i++ ){
				var ele = self[i];

				for( var j = 0; j < classes.length; j++ ){
					var cls = classes[j];

					if( $$.is.emptyString(cls) ){ continue; }
					
					var hasClass = ele._private.classes[cls];
					var shouldAdd = toggle || (toggle === undefined && !hasClass);

					if( shouldAdd ){
						ele._private.classes[cls] = true;
					} else { // then remove
						ele._private.classes[cls] = false;
					}

				} // for j classes
			} // for i eles
			
			self.updateStyle().rtrigger("class");
			return self;
		},

		removeClass: function(classes){
			classes = classes.split(/\s+/);
			var self = this;
			
			for( var i = 0, il = self.length; i < il; i++ ){
				var ele = self[i];

				for( var j = 0, jl = classes.length; j < jl; j++ ){
					var cls = classes[j];
					if( !cls || cls === "" ){ continue; }

					delete ele._private.classes[cls];
				}
			}
			
			self.updateStyle().rtrigger("class");
			return self;
		}
	});
	
})(jQuery, jQuery.cytoscape);

;(function($, $$){

	$$.fn.eles({
		allAre: function(selector){
			return this.filter(selector).length === this.length;
		},

		is: function(selector){
			return this.filter(selector).length > 0;
		},

		same: function( collection ){
			collection = this.cy().collection( collection );

			// cheap extra check
			if( this.length !== collection.length ){
				return false;
			}

			return this.intersect( collection ).length === this.length;
		},

		anySame: function(collection){
			collection = this.cy().collection( collection );

			return this.intersect( collection ).length > 0;
		},

		allAreNeighbors: function(collection){
			collection = this.cy().collection( collection );

			return this.neighborhood().intersect( collection ).length === collection.length;
		}
	});
	
})(jQuery, jQuery.cytoscape);

;(function($, $$){
	
	$$.fn.eles({

		// fully updates (recalculates) the style for the elements
		updateStyle: function( notifyRenderer ){
			var cy = this._private.cy;
			var style = cy.style();
			notifyRenderer = notifyRenderer || notifyRenderer === undefined ? true : false;

			for( var i = 0; i < this.length; i++ ){
				var ele = this[i];
				style.apply( ele );
			}

			if( notifyRenderer ){
				this.rtrigger("style"); // let renderer know we changed style
			} else {
				this.trigger("style"); // just fire the event
			}
			return this; // chaining
		},

		// just update the mappers in the elements' styles; cheaper than eles.updateStyle()
		updateMappers: function( notifyRenderer ){
			var cy = this._private.cy;
			var style = cy.style();
			notifyRenderer = notifyRenderer || notifyRenderer === undefined ? true : false;

			for( var i = 0; i < this.length; i++ ){
				var ele = this[i];
				style.apply( ele );
			}

			if( notifyRenderer ){
				this.rtrigger("style"); // let renderer know we changed style
			} else {
				this.trigger("style"); // just fire the event
			}
			return this; // chaining
		},

		data: $$.define.data({
			field: "data",
			bindingEvent: "data",
			allowBinding: true,
			allowSetting: true,
			settingEvent: "data",
			settingTriggersEvent: true,
			triggerFnName: "trigger",
			allowGetting: true,
			immutableKeys: {
				"id": true,
				"source": true,
				"target": true,
				"parent": true
			},
			updateMappers: true
		}),

		removeData: $$.define.removeData({
			field: "data",
			event: "data",
			triggerFnName: "trigger",
			triggerEvent: true,
			immutableKeys: {
				"id": true,
				"source": true,
				"target": true,
				"parent": true
			},
			updateMappers: true
		}),

		scratch: $$.define.data({
			field: "scratch",
			allowBinding: false,
			allowSetting: true,
			settingTriggersEvent: false,
			allowGetting: true
		}),

		removeScratch: $$.define.removeData({
			field: "scratch",
			triggerEvent: false
		}),

		rscratch: $$.define.data({
			field: "rscratch",
			allowBinding: false,
			allowSetting: true,
			settingTriggersEvent: false,
			allowGetting: true
		}),

		removeRscratch: $$.define.removeData({
			field: "rscratch",
			triggerEvent: false
		}),

		id: function(){
			var ele = this[0];

			if( ele ){
				return ele._private.data.id;
			}
		},

		position: $$.define.data({
			field: "position",
			bindingEvent: "position",
			allowBinding: true,
			allowSetting: true,
			settingEvent: "position",
			settingTriggersEvent: true,
			triggerFnName: "rtrigger",
			allowGetting: true,
			validKeys: ["x", "y"]
		}),

		positions: function( pos ){
			if( $$.is.plainObject(pos) ){
				this.position(pos);
				
			} else if( $$.is.fn(pos) ){
				var fn = pos;
				
				for( var i = 0; i < this.length; i++ ){
					var ele = this[i];

					var pos = fn.apply(ele, [i, ele]);

					var elePos = ele._private.position;
					elePos.x = pos.x;
					elePos.y = pos.y;
				}
				
				this.rtrigger("position");
			}

			return this; // chaining
		},

		// get the rendered (i.e. on screen) positon of the element
		// TODO allow setting
		renderedPosition: function( dim ){
			var ele = this[0];
			var cy = this.cy();
			var zoom = cy.zoom();
			var pan = cy.pan();

			if( ele && ele.isNode() ){ // must have an element and must be a node to return position
				var pos = ele._private.position;
				var rpos = {
					x: pos.x * zoom + pan.x,
					y: pos.y * zoom + pan.y
				};

				if( dim === undefined ){ // then return the whole rendered position
					return rpos;
				} else { // then return the specified dimension
					return rpos[ dim ];
				}
			}
		},

		// get the specified css property as a rendered value (i.e. on-screen value)
		// or get the whole rendered style if no property specified (NB doesn't allow setting)
		renderedCss: function( property ){
			var ele = this[0];

			if( ele ){
				var renstyle = ele.cy().style().getRenderedStyle( ele );

				if( property === undefined ){
					return renstyle;
				} else {
					return renstyle[ property ];
				}
			}
		},

		// read the calculated css style of the element or override the style (via a bypass)
		css: function( name, value ){
			var style = this.cy().style();

			if( $$.is.plainObject(name) ){ // then extend the bypass
				var props = name;
				style.applyBypass( this, props );
				this.rtrigger("style"); // let the renderer know we've updated style

			} else if( $$.is.string(name) ){
	
				if( value === undefined ){ // then get the property from the style
					var ele = this[0];

					if( ele ){
						return ele._private.style[ name ].strValue;
					} else { // empty collection => can't get any value
						return;
					}

				} else { // then set the bypass with the property value
					style.applyBypass( this, name, value );
					this.rtrigger("style"); // let the renderer know we've updated style
				}

			} else if( name === undefined ){
				var ele = this[0];

				if( ele ){
					return style.getRawStyle( ele );
				} else { // empty collection => can't get any value
					return;
				}
			}

			return this; // chaining
		},

		show: function(){
			this.css("visibility", "visible");
			return this; // chaining
		},

		hide: function(){
			this.css("visibility", "hidden");
			return this; // chaining
		},

		visible: function(){
			var ele = this[0];

			if( ele ){
				if( ele.css("visibility") !== "visible" ){
					return false;
				}
				
				if( ele.isNode() ){
					var parents = ele.parents();
					for( var i = 0; i < parents.length; i++ ){
						var parent = parents[i];
						var parentVisibility = parent.css("visibility");

						if( parentVisibility !== "visible" ){
							return false;
						}
					}

					return true;
				} else if( ele.isEdge() ){
					var src = ele.source();
					var tgt = ele.target();

					return src.visible() && tgt.visible();
				}

			}
		},

		hidden: function(){
			var ele = this[0];

			if( ele ){
				return !this.visible();
			}
		},

		// convenience function to get a numerical value for the width of the node/edge
		width: function(){
			var ele = this[0];

			if( ele ){
				return this._private.style.width.pxValue;
			}
		},

		outerWidth: function(){
			var ele = this[0];

			if( ele ){
				var style = this._private.style;
				var width = style.width.pxValue;
				var border = style["border-width"] ? style["border-width"].pxValue : 0;

				return width + border;
			}
		},

		renderedWidth: function(){
			var ele = this[0];

			if( ele ){
				var width = this.width();
				return width * this.cy().zoom();
			}
		},

		renderedOuterWidth: function(){
			var ele = this[0];

			if( ele ){
				var owidth = this.outerWidth();
				return owidth * this.cy().zoom();
			}
		},

		// convenience function to get a numerical value for the height of the node
		height: function(){
			var ele = this[0];

			if( ele && ele.isNode() ){
				return this._private.style.height.pxValue;
			}
		},

		outerHeight: function(){
			var ele = this[0];

			if( ele ){
				var style = this._private.style;
				var height = style.height.pxValue;
				var border = style["border-width"] ? style["border-width"].pxValue : 0;

				return height + border;
			}
		},

		renderedHeight: function(){
			var ele = this[0];

			if( ele ){
				var height = this.height();
				return height * this.cy().zoom();
			}
		},

		renderedOuterHeight: function(){
			var ele = this[0];

			if( ele ){
				var oheight = this.outerHeight();
				return oheight * this.cy().zoom();
			}
		},

		// get the position of the element relative to the container (i.e. not relative to parent node)
		offset: function(){
			var ele = this[0];

			if( ele && ele.isNode() ){
				var offset = {
					x: ele._private.position.x,
					y: ele._private.position.y
				};

				var parents = ele.parents();
				for( var i = 0; i < parents.length; i++ ){
					var parent = parents[i];
					var parentPos = parent._private.position;

					offset.x += parentPos.x;
					offset.y += parentPos.y;
				}

				return offset;
			}
		},

		renderedOffset: function(){
			var ele = this[0];

			if( ele && ele.isNode() ){
				var offset = this.offset();
				var cy = this.cy();
				var zoom = cy.zoom();
				var pan = cy.pan();

				return {
					x: offset.x * zoom + pan.x,
					y: offset.y * zoom + pan.y
				};
			}
		}
	});

	
})(jQuery, jQuery.cytoscape);

;(function($, $$){
	
	// Regular degree functions (works on single element)
	////////////////////////////////////////////////////////////////////////////////////////////////////
	
	function defineDegreeFunction(callback){
		return function(){
			var self = this;
			
			if( self.length === 0 ){ return; }

			if( self.isNode() && !self.removed() ){
				var degree = 0;
				var node = self[0];
				var connectedEdges = node._private.edges;

				for( var i = 0; i < connectedEdges.length; i++ ){
					var edge = connectedEdges[i];
					degree += callback( node, edge );
				}
				
				return degree;
			} else {
				return;
			}
		};
	}
	
	$$.fn.eles({
		degree: defineDegreeFunction(function(node, edge){
			if( edge.source().same( edge.target() ) ){
				return 2;
			} else {
				return 1;
			}
		}),

		indegree: defineDegreeFunction(function(node, edge){
			if( edge.target().same(node) ){
				return 1;
			} else {
				return 0;
			}
		}),

		outdegree: defineDegreeFunction(function(node, edge){
			if( edge.source().same(node) ){
				return 1;
			} else {
				return 0;
			}
		})
	});
	
	
	// Collection degree stats
	////////////////////////////////////////////////////////////////////////////////////////////////////
	
	function defineDegreeBoundsFunction(degreeFn, callback){
		return function(){
			var ret = undefined;
			var nodes = this.nodes();

			for( var i = 0; i < nodes.length; i++ ){
				var ele = nodes[i];
				var degree = ele[degreeFn]();
				if( degree !== undefined && (ret === undefined || callback(degree, ret)) ){
					ret = degree;
				}
			}
			
			return ret;
		};
	}
	
	$$.fn.eles({
		minDegree: defineDegreeBoundsFunction("degree", function(degree, min){
			return degree < min;
		}),

		maxDegree: defineDegreeBoundsFunction("degree", function(degree, max){
			return degree > max;
		}),

		minIndegree: defineDegreeBoundsFunction("indegree", function(degree, min){
			return degree < min;
		}),

		maxIndegree: defineDegreeBoundsFunction("indegree", function(degree, max){
			return degree > max;
		}),

		minOutdegree: defineDegreeBoundsFunction("outdegree", function(degree, min){
			return degree < min;
		}),

		maxOutdegree: defineDegreeBoundsFunction("outdegree", function(degree, max){
			return degree > max;
		})
	});
	
	$$.fn.eles({
		totalDegree: function(){
			var total = 0;
			var nodes = this.nodes();

			for( var i = 0; i < nodes.length; i++ ){
				total += nodes[i].degree();
			}

			return total;
		}
	});
	
})(jQuery, jQuery.cytoscape);

	

;(function($, $$){
	
	// Functions for binding & triggering events
	////////////////////////////////////////////////////////////////////////////////////////////////////
	
	$$.fn.eles({
		on: $$.define.on(), // .on( events [, selector] [, data], handler)
		one: $$.define.on({ unbindSelfOnTrigger: true }),
		once: $$.define.on({ unbindAllBindersOnTrigger: true }),
		off: $$.define.off(), // .off( events [, selector] [, handler] )
		trigger: $$.define.trigger(), // .trigger( events [, extraParams] )

		rtrigger: function(event, extraParams){ // for internal use only
			// notify renderer unless removed
			this.cy().notify({
				type: event,
				collection: this.filter(function(){
					return !this.removed();
				})
			});
			
			this.trigger(event, extraParams);
			return this;
		}
	});

	// aliases for those folks who like old stuff:
	$$.elesfn.bind = $$.elesfn.on;
	$$.elesfn.unbind = $$.elesfn.off;

	// add event aliases like .click()
	$$.define.event.aliasesOn( $$.elesfn );
	
})(jQuery, jQuery.cytoscape);

;(function($, $$){

	$$.fn.eles({
		isNode: function(){
			return this.group() === "nodes";
		},

		isEdge: function(){
			return this.group() === "edges";
		},

		isLoop: function(){
			return this.isEdge() && this.source().id() === this.target().id();
		},

		group: function(){
			var ele = this[0];

			if( ele ){
				return ele._private.group;
			}
		}
	});

	
})(jQuery, jQuery.cytoscape);

;(function($, $$){
	
	// Functions for iterating over collections
	////////////////////////////////////////////////////////////////////////////////////////////////////
	
	$$.fn.eles({
		each: function(fn){
			if( $$.is.fn(fn) ){
				for(var i = 0; i < this.length; i++){
					var ele = this[i];
					var ret = fn.apply( ele, [ i, ele ] );

					if( ret === false ){ break; } // exit each early on return false
				}
			}
			return this;
		},

		toArray: function(){
			var array = [];
			
			for(var i = 0; i < this.length; i++){
				array.push( this[i] );
			}
			
			return array;
		},

		slice: function(start, end){
			var array = [];
			var thisSize = this.length;
			
			if( end == null ){
				end = thisSize;
			}
			
			if( start < 0 ){
				start = thisSize + start;
			}
			
			for(var i = start; i >= 0 && i < end && i < thisSize; i++){
				array.push( this[i] );
			}
			
			return new $$.Collection(this.cy(), array);
		},

		size: function(){
			return this.length;
		},

		eq: function(i){
			return this[i];
		},

		empty: function(){
			return this.length === 0;
		},

		nonempty: function(){
			return !this.empty();
		}
	});
	
})(jQuery, jQuery.cytoscape);

;(function($, $$){
	
	// Collection functions that toggle a boolean value
	////////////////////////////////////////////////////////////////////////////////////////////////////
	
	
	function defineSwitchFunction(params){
		return function(){
			var args = arguments;
			
			// e.g. cy.nodes().select( data, handler )
			if( args.length === 2 ){
				var data = args[0];
				var handler = args[1];
				this.bind( params.event, data, handler );
			} 
			
			// e.g. cy.nodes().select( handler )
			else if( args.length === 1 ){
				var handler = args[0];
				this.bind( params.event, handler );
			}
			
			// e.g. cy.nodes().select()
			else if( args.length === 0 ){
				for( var i = 0; i < this.length; i++ ){
					var ele = this[i];

					if( !params.ableField || ele._private[params.ableField] ){
						ele._private[params.field] = params.value;
					}
				}
				this.updateStyle(); // change of state => possible change of style
				this.trigger(params.event);
			}

			return this;
		};
	}
	
	function defineSwitchSet( params ){
		$$.elesfn[ params.field ] = function(){
			var ele = this[0];
			if( ele ){
				return ele._private[ params.field ];
			}
		};
		
		$$.elesfn[ params.on ] = defineSwitchFunction({
			event: params.on,
			field: params.field,
			ableField: params.ableField,
			value: true
		});

		$$.elesfn[ params.off ] = defineSwitchFunction({
			event: params.off,
			field: params.field,
			ableField: params.ableField,
			value: false
		});
	}
	
	defineSwitchSet({
		field: "locked",
		on: "lock",
		off: "unlock"
	});
	
	defineSwitchSet({
		field: "grabbable",
		on: "grabify",
		off: "ungrabify"
	});
	
	defineSwitchSet({
		field: "selected",
		ableField: "selectable",
		on: "select",
		off: "unselect"
	});
	
	defineSwitchSet({
		field: "selectable",
		on: "selectify",
		off: "unselectify"
	});
	
	$$.elesfn.grabbed = function(){
		var ele = this[0];
		if( ele ){
			return ele._private.grabbed;
		}
	};
	
})(jQuery, jQuery.cytoscape);

;(function($, $$){
	
	$$.fn.eles({
		nodes: function(selector){
			return this.filter(function(i, element){
				return element.isNode();
			}).filter(selector);
		},

		edges: function(selector){
			return this.filter(function(i, element){
				return element.isEdge();
			}).filter(selector);
		},

		filter: function(filter){
			var cy = this._private.cy;
			
			if( $$.is.fn(filter) ){
				var elements = [];

				for( var i = 0; i < this.length; i++ ){
					var ele = this[i];

					if( filter.apply(ele, [i, ele]) ){
						elements.push(ele);
					}
				}
				
				return new $$.Collection(cy, elements);
			
			} else if( $$.is.string(filter) || $$.is.elementOrCollection(filter) ){
				return new $$.Selector(filter).filter(this);
			
			} else if( filter === undefined ){
				return this;
			}

			return new $$.Collection( cy ); // if not handled by above, give 'em an empty collection
		},

		not: function(toRemove){
			var cy = this._private.cy;

			if( !toRemove ){
				return this;
			} else {
			
				if( $$.is.string( toRemove ) ){
					toRemove = this.filter( toRemove );
				}
				
				var elements = [];
				
				for( var i = 0; i < this.length; i++ ){
					var element = this[i];

					var remove = toRemove._private.ids[ element.id() ];
					if( !remove ){
						elements.push( element );
					}
				}
				
				return new $$.Collection( cy, elements );
			}
			
		},

		intersect: function( other ){
			var self = this;
			var cy = this._private.cy;
			
			// if a selector is specified, then filter by it
			if( $$.is.string(other) ){
				var selector = other;
				return this.filter( selector );
			}
			
			var elements = [];
			var col1 = this;
			var col2 = other;
			var col1Smaller = this.length < other.length;
			var ids1 = col1Smaller ? col1._private.ids : col2._private.ids;
			var ids2 = col1Smaller ? col2._private.ids : col1._private.ids;
			
			for( var id in ids1 ){
				var ele = ids2[ id ];

				if( ele ){
					elements.push( ele );
				}
			}
			
			return new $$.Collection( cy, elements );
		},

		add: function(toAdd){
			var self = this;
			var cy = this._private.cy;		
			
			if( !toAdd ){
				return this;
			}
			
			if( $$.is.string(toAdd) ){
				var selector = toAdd;
				toAdd = cy.elements(selector);
			}
			
			var elements = [];
			var ids = {};
		
			function add(element){
				if( !element ){
					return;
				}
				
				if( !ids[ element.id() ] ){
					elements.push( element );
					ids[ element.id() ] = true;
				}
			}
			
			// add own
			for( var i = 0; i < self.length; i++ ){
				var element = self[i];
				add(element);
			}
			
			// add toAdd
			for( var i = 0; i < toAdd.length; i++ ){
				var element = toAdd[i];
				add(element);
			}
			
			return new $$.Collection(cy, elements);
		}
	});



	// Neighbourhood functions
	//////////////////////////

	$$.fn.eles({
		neighborhood: function(selector){
			var elements = [];
			var cy = this._private.cy;
			var nodes = this.nodes();

			for( var i = 0; i < nodes.length; i++ ){ // for all nodes
				var node = nodes[i];
				var connectedEdges = node.connectedEdges();

				// for each connected edge, add the edge and the other node
				for( var j = 0; j < connectedEdges.length; j++ ){
					var edge = connectedEdges[j];
					var otherNode = edge.connectedNodes().not(node);

					// need check in case of loop
					if( otherNode.length > 0 ){
						elements.push( otherNode[0] ); // add node 1 hop away
					}
					
					// add connected edge
					elements.push( edge[0] );
				}

			}
			
			return ( new $$.Collection( cy, elements ) ).filter( selector );
		},

		closedNeighborhood: function(selector){
			return this.neighborhood().add(this).filter(selector);
		},

		openNeighborhood: function(selector){
			return this.neighborhood(selector);
		}
	});	


	// Edge functions
	/////////////////

	$$.fn.eles({
		source: defineSourceFunction({
			attr: "source"
		}),

		target: defineSourceFunction({
			attr: "target"
		})
	});
	
	function defineSourceFunction( params ){
		return function( selector ){
			var sources = [];
			var edges = this.edges();
			var cy = this._private.cy;

			for( var i = 0; i < edges.length; i++ ){
				var edge = edges[i];
				var id = edge._private.data[params.attr];
				var src = cy.getElementById( id );

				if( src.length > 0 ){
					sources.push( src );
				}
			}
			
			return new $$.Collection( cy, sources ).filter( selector );
		}
	}

	$$.fn.eles({
		edgesWith: defineEdgesWithFunction(),

		edgesTo: defineEdgesWithFunction({
			thisIs: "source"
		})
	});
	
	function defineEdgesWithFunction( params ){
		var defaults = {
		};
		params = $.extend(true, {}, defaults, params);
		
		return function(otherNodes){
			var elements = [];
			var cy = this._private.cy;
			var p = params;

			// get elements if a selector is specified
			if( $$.is.string(otherNodes) ){
				otherNodes = cy.$( otherNodes );
			}
			
			var edges = otherNodes.connectedEdges();
			var thisIds = this._private.ids;
			
			for( var i = 0; i < edges.length; i++ ){
				var edge = edges[i];
				var foundId;
				var edgeData = edge._private.data;

				if( p.thisIs ){
					var idToFind = edgeData[ p.thisIs ];
					foundId = thisIds[ idToFind ];
				} else {
					foundId = thisIds[ edgeData.source ] || thisIds[ edgeData.target ];
				}
				
				if( foundId ){
					elements.push( edge );
				}
			}
			
			return new $$.Collection( cy, elements );
		};
	}
	
	$$.fn.eles({
		connectedEdges: function( selector ){
			var elements = [];
			var cy = this._private.cy;
			
			var nodes = this.nodes();
			for( var i = 0; i < nodes.length; i++ ){
				var node = nodes[i];
				var edges = node._private.edges;

				for( var j = 0; j < edges.length; j++ ){
					var edge = edges[j];					
					elements.push( edge );
				}
			}
			
			return new $$.Collection( cy, elements ).filter( selector );
		},

		connectedNodes: function( selector ){
			var elements = [];
			var cy = this._private.cy;

			var edges = this.edges();
			for( var i = 0; i < edges.length; i++ ){
				var edge = edges[i];

				elements.push( edge.source()[0] );
				elements.push( edge.target()[0] );
			}

			return new $$.Collection( cy, elements ).filter( selector );
		},

		parallelEdges: defineParallelEdgesFunction(),

		codirectedEdges: defineParallelEdgesFunction({
			codirected: true
		})
	});
	
	function defineParallelEdgesFunction(params){
		var defaults = {
			codirected: false
		};
		params = $.extend(true, {}, defaults, params);
		
		return function( selector ){
			var cy = this._private.cy;
			var elements = [];
			var edges = this.edges();
			var p = params;

			// look at all the edges in the collection
			for( var i = 0; i < edges.length; i++ ){
				var edge1 = edges[i];
				var src1 = edge1.source()[0];
				var srcid1 = src1.id();
				var tgt1 = edge1.target()[0];
				var tgtid1 = tgt1.id();
				var srcEdges1 = src1._private.edges;

				// look at edges connected to the src node of this edge
				for( var j = 0; j < srcEdges1.length; j++ ){
					var edge2 = srcEdges1[j];
					var edge2data = edge2._private.data;
					var tgtid2 = edge2data.target;
					var srcid2 = edge2data.source;

					var codirected = tgtid2 === tgtid1 && srcid2 === srcid1;
					var oppdirected = srcid1 === tgtid2 && tgtid1 === srcid2;
					
					if( (p.codirected && codirected)
					|| (!p.codirected && (codirected || oppdirected)) ){
						elements.push( edge2 );
					}
				}
			}
			
			return new $$.Collection( cy, elements ).filter( selector );
		};
	
	}


	// Compound functions
	/////////////////////

	$$.fn.eles({
		parent: function( selector ){
			var parents = [];
			var cy = this._private.cy;

			for( var i = 0; i < this.length; i++ ){
				var ele = this[i];
				var parent = cy.getElementById( ele._private.data.parent );

				if( parent.size() > 0 ){
					parents.push( parent );
				}
			}
			
			return new $$.Collection( cy, parents ).filter( selector );
		},

		parents: function( selector ){
			var parents = [];

			var eles = this.parent();
			while( eles.nonempty() ){
				for( var i = 0; i < eles.length; i++ ){
					var ele = eles[i];
					parents.push( ele );
				}

				eles = eles.parent();
			}

			return new $$.Collection( this.cy(), parents ).filter( selector );
		},

		children: function( selector ){
			var children = [];

			for( var i = 0; i < this.length; i++ ){
				var ele = this[i];
				children = children.concat( ele._private.children );
			}

			return new $$.Collection( this.cy(), children ).filter( selector );
		},

		siblings: function( selector ){
			return this.parent().children().not( this ).filter( selector );
		},

		descendants: function( selector ){
			var elements = [];

			function add( eles ){
				for( var i = 0; i < eles.length; i++ ){
					var ele = eles[i];

					elements.push( ele );

					if( ele.children().nonempty() ){
						add( ele.children() );
					}
				}
			}

			add( this.children() );

			return new $$.Collection( this.cy(), elements ).filter( selector );
		}
	});

	
})(jQuery, jQuery.cytoscape);

;(function($, $$){
		
	// Selector
	////////////////////////////////////////////////////////////////////////////////////////////////////
	
	$$.fn.selector = function(map, options){
		for( var name in map ){
			var fn = map[name];
			$$.Selector.prototype[ name ] = fn;
		}
	};

	$$.Selector = function(onlyThisGroup, selector){
		
		if( !(this instanceof $$.Selector) ){
			return new $$.Selector(onlyThisGroup, selector);
		}
	
		if( selector === undefined && onlyThisGroup !== undefined ){
			selector = onlyThisGroup;
			onlyThisGroup = undefined;
		}
		
		var self = this;
		
		self._private = {
			selectorText: null,
			invalid: true
		}
	
		// storage for parsed queries
		// when you add something here, also add to Selector.toString()
		function newQuery(){
			return {
				classes: [], 
				colonSelectors: [],
				data: [],
				group: null,
				ids: [],
				meta: [],

				// fake selectors
				collection: null, // a collection to match against
				filter: null, // filter function

				// these are defined in the upward direction rather than down (e.g. child)
				// because we need to go up in Selector.filter()
				parent: null, // parent query obj
				ancestor: null, // ancestor query obj
				subject: null, // defines subject in compound query (subject query obj; points to self if subject)

				// use these only when subject has been defined
				child: null,
				descendant: null
			};
		}
		
		if( !selector || ( $$.is.string(selector) && selector.match(/^\s*$/) ) ){
			
			if( onlyThisGroup == null ){
				// ignore
				self.length = 0;
			} else {
				self[0] = newQuery();
				self[0].group = onlyThisGroup;
				self.length = 1;
			}
							
		} else if( $$.is.element( selector ) ){
			var collection = new $$.Collection(self.cy(), [ selector ]);
			
			self[0] = newQuery();
			self[0].collection = collection;
			self.length = 1;
			
		} else if( $$.is.collection( selector ) ){
			self[0] = newQuery();
			self[0].collection = selector;
			self.length = 1;
			
		} else if( $$.is.fn( selector ) ) {
			self[0] = newQuery();
			self[0].filter = selector;
			self.length = 1;
			
		} else if( $$.is.string( selector ) ){
		
			// these are the actual tokens in the query language
			var metaChar = "[\\!\\\"\\#\\$\\%\\&\\\'\\(\\)\\*\\+\\,\\.\\/\\:\\;\\<\\=\\>\\?\\@\\[\\]\\^\\`\\{\\|\\}\\~]"; // chars we need to escape in var names, etc
			var variable = "(?:[\\w-]|(?:\\\\"+ metaChar +"))+"; // a variable name
			var comparatorOp = "=|\\!=|>|>=|<|<=|\\$=|\\^=|\\*="; // binary comparison op (used in data selectors)
			var boolOp = "\\?|\\!|\\^"; // boolean (unary) operators (used in data selectors)
			var string = '"(?:\\\\"|[^"])+"' + "|" + "'(?:\\\\'|[^'])+'"; // string literals (used in data selectors) -- doublequotes | singlequotes
			var number = $$.util.regex.number; // number literal (used in data selectors) --- e.g. 0.1234, 1234, 12e123
			var value = string + "|" + number; // a value literal, either a string or number
			var meta = "degree|indegree|outdegree"; // allowed metadata fields (i.e. allowed functions to use from $$.Collection)
			var separator = "\\s*,\\s*"; // queries are separated by commas; e.g. edge[foo = "bar"], node.someClass
			var className = variable; // a class name (follows variable conventions)
			var descendant = "\\s+";
			var child = "\\s+>\\s+";
			var subject = "\\$";
			var id = variable; // an element id (follows variable conventions)
			
			// when a token like a variable has escaped meta characters, we need to clean the backslashes out
			// so that values get compared properly in Selector.filter()
			function cleanMetaChars(str){
				return str.replace(new RegExp("\\\\(" + metaChar + ")", "g"), "\1");
			}
			
			// add @ variants to comparatorOp
			$.each( comparatorOp.split("|"), function(i, op){
				comparatorOp += "|@" + op;
			} );

			// the current subject in the query
			var currentSubject = null;
			
			// NOTE: add new expression syntax here to have it recognised by the parser;
			// a query contains all adjacent (i.e. no separator in between) expressions;
			// the current query is stored in self[i] --- you can use the reference to `this` in the populate function;
			// you need to check the query objects in Selector.filter() for it actually filter properly, but that's pretty straight forward
			var exprs = {
				group: {
					query: true,
					regex: "(node|edge|\\*)",
					populate: function( group ){
						this.group = group == "*" ? group : group + "s";
					}
				},
				
				state: {
					query: true,
					regex: "(:selected|:unselected|:locked|:unlocked|:visible|:hidden|:grabbed|:free|:removed|:inside|:grabbable|:ungrabbable|:animated|:unanimated|:selectable|:unselectable|:parent|:child)",
					populate: function( state ){
						this.colonSelectors.push( state );
					}
				},
				
				id: {
					query: true,
					regex: "\\#("+ id +")",
					populate: function( id ){
						this.ids.push( cleanMetaChars(id) );
					}
				},
				
				className: {
					query: true,
					regex: "\\.("+ className +")",
					populate: function( className ){
						this.classes.push( cleanMetaChars(className) );
					}
				},
				
				dataExists: {
					query: true,
					regex: "\\[\\s*("+ variable +")\\s*\\]",
					populate: function( variable ){
						this.data.push({
							field: cleanMetaChars(variable)
						});
					}
				},
				
				dataCompare: {
					query: true,
					regex: "\\[\\s*("+ variable +")\\s*("+ comparatorOp +")\\s*("+ value +")\\s*\\]",
					populate: function( variable, comparatorOp, value ){
						this.data.push({
							field: cleanMetaChars(variable),
							operator: comparatorOp,
							value: value
						});
					}
				},
				
				dataBool: {
					query: true,
					regex: "\\[\\s*("+ boolOp +")\\s*("+ variable +")\\s*\\]",
					populate: function( boolOp, variable ){
						this.data.push({
							field: cleanMetaChars(variable),
							operator: boolOp
						});
					}
				},
				
				metaCompare: {
					query: true,
					regex: "\\{\\s*("+ meta +")\\s*("+ comparatorOp +")\\s*("+ number +")\\s*\\}",
					populate: function( meta, comparatorOp, number ){
						this.meta.push({
							field: cleanMetaChars(meta),
							operator: comparatorOp,
							value: number
						});
					}
				},

				nextQuery: {
					separator: true,
					regex: separator,
					populate: function(){
						// go on to next query
						self[++i] = newQuery();
						currentSubject = null;
					}
				},

				child: {
					separator: true,
					regex: child,
					populate: function(){
						// this query is the parent of the following query
						var childQuery = newQuery();
						childQuery.parent = this;
						childQuery.subject = currentSubject;

						// we're now populating the child query with expressions that follow
						self[i] = childQuery;
					}
				},

				descendant: {
					separator: true,
					regex: descendant,
					populate: function(){
						// this query is the ancestor of the following query
						var descendantQuery = newQuery();
						descendantQuery.ancestor = this;
						descendantQuery.subject = currentSubject;

						// we're now populating the descendant query with expressions that follow
						self[i] = descendantQuery;
					}
				},

				subject: {
					modifier: true,
					regex: subject,
					populate: function(){
						if( currentSubject != null && this.subject != this ){
							$.error("Redefinition of subject in selector `%s`", selector);
							return false;
						}

						currentSubject = this;
						this.subject = this;
					},

				}
			};

			self._private.selectorText = selector;
			var remaining = selector;
			var i = 0;
			
			// of all the expressions, find the first match in the remaining text
			function consumeExpr( expectation ){
				var expr;
				var match;
				var name;
				
				$.each(exprs, function(n, e){ // n: name, e: expression

					// ignore this expression if it doesn't meet the expectation function
					if( $$.is.fn( expectation ) && !expectation(n, e) ){ return }

					var m = remaining.match(new RegExp( "^" + e.regex ));
					
					if( m != null ){
						match = m;
						expr = e;
						name = n;
						
						var consumed = m[0];
						remaining = remaining.substring( consumed.length );								
						
						return false;
					}
				});
				
				return {
					expr: expr,
					match: match,
					name: name
				};
			}
			
			// consume all leading whitespace
			function consumeWhitespace(){
				var match = remaining.match(/^\s+/);
				
				if( match ){
					var consumed = match[0];
					remaining = remaining.substring( consumed.length );
				}
			}
			
			self[0] = newQuery(); // get started

			consumeWhitespace(); // get rid of leading whitespace
			for(;;){				
				var check = consumeExpr();
				
				if( check.expr == null ){
					$.error("The selector `%s` is invalid", selector);
					return;
				} else {
					var args = [];
					for(var j = 1; j < check.match.length; j++){
						args.push( check.match[j] );
					}
					
					// let the token populate the selector object (i.e. in self[i])
					var ret = check.expr.populate.apply( self[i], args );

					if( ret === false ){ return } // exit if population failed
				}
				
				// we're done when there's nothing left to parse
				if( remaining.match(/^\s*$/) ){
					break;
				}
			}
			
			self.length = i + 1;

			// adjust references for subject
			for(j = 0; j < self.length; j++){
				var query = self[j];

				if( query.subject != null ){
					// go up the tree until we reach the subject
					for(;;){
						if( query.subject == query ){ break } // done if subject is self

						if( query.parent != null ){ // swap parent/child reference
							var parent = query.parent;
							var child = query;

							child.parent = null;
							parent.child = child;

							query = parent; // go up the tree
						} else if( query.ancestor != null ){ // swap ancestor/descendant
							var ancestor = query.ancestor;
							var descendant = query;

							descendant.ancestor = null;
							ancestor.descendant = descendant;

							query = ancestor; // go up the tree
						} else {
							$.error("When adjusting references for the selector `%s`, neither parent nor ancestor was found");
							break;
						}
					} // for

					self[j] = query.subject; // subject should be the root query
				} // if
			} // for

			// make sure for each query that the subject group matches the implicit group if any
			if( onlyThisGroup != null ){
				for(var j = 0; j < self.length; j++){
					if( self[j].group != null && self[j].group != onlyThisGroup ){
						$.error("Group `%s` conflicts with implicit group `%s` in selector `%s`", self[j].group, onlyThisGroup, selector);
						return;
					}

					self[j].group = onlyThisGroup; // set to implicit group
				}
			}
			
		} else {
			$.error("A selector must be created from a string; found %o", selector);
			return;
		}

		self._private.invalid = false;
		
	};

	$$.selfn = $$.Selector.prototype;
	
	$$.selfn.size = function(){
		return this.length;
	};
	
	$$.selfn.eq = function(i){
		return this[i];
	};
	
	// get elements from the core and then filter them
	$$.selfn.find = function(){
		// TODO impl if we decide to use a DB for storing elements
	};
	
	// filter an existing collection
	$$.selfn.filter = function(collection, addLiveFunction){
		var self = this;
		var cy = collection.cy();
		
		// don't bother trying if it's invalid
		if( self._private.invalid ){
			return new $$.Collection( cy );
		}
		
		var queryMatches = function(query, element){
			// check group
			if( query.group != null && query.group != "*" && query.group != element._private.group ){
				return false;
			}
			
			// check colon selectors
			var allColonSelectorsMatch = true;
			for(var k = 0; k < query.colonSelectors.length; k++){
				var sel = query.colonSelectors[k];
				var renderer = cy.renderer(); // TODO remove reference after refactoring
				
				switch(sel){
				case ":selected":
					allColonSelectorsMatch = element.selected();
					break;
				case ":unselected":
					allColonSelectorsMatch = !element.selected();
					break;
				case ":selectable":
					allColonSelectorsMatch = element.selectable();
					break;
				case ":unselectable":
					allColonSelectorsMatch = !element.selectable();
					break;
				case ":locked":
					allColonSelectorsMatch = element.locked();
					break;
				case ":unlocked":
					allColonSelectorsMatch = !element.locked();
					break;
				case ":visible":
					allColonSelectorsMatch = element.visible();
					break;
				case ":hidden":
					allColonSelectorsMatch = !element.visible();
					break;
				case ":grabbed":
					allColonSelectorsMatch = element.grabbed();
					break;
				case ":free":
					allColonSelectorsMatch = !element.grabbed();
					break;
				case ":removed":
					allColonSelectorsMatch = element.removed();
					break;
				case ":inside":
					allColonSelectorsMatch = !element.removed();
					break;
				case ":grabbable":
					allColonSelectorsMatch = element.grabbable();
					break;
				case ":ungrabbable":
					allColonSelectorsMatch = !element.grabbable();
					break;
				case ":animated":
					allColonSelectorsMatch = element.animated();
					break;
				case ":unanimated":
					allColonSelectorsMatch = !element.animated();
					break;
				case ":parent":
					allColonSelectorsMatch = element.children().nonempty();
					break;
				case ":child":
					allColonSelectorsMatch = element.parent().nonempty();
					break;
				}
				
				if( !allColonSelectorsMatch ) break;
			}
			if( !allColonSelectorsMatch ) return false;
			
			// check id
			var allIdsMatch = true;
			for(var k = 0; k < query.ids.length; k++){
				var id = query.ids[k];
				var actualId = element._private.data.id;
				
				allIdsMatch = allIdsMatch && (id == actualId);
				
				if( !allIdsMatch ) break;
			}
			if( !allIdsMatch ) return false;
			
			// check classes
			var allClassesMatch = true;
			for(var k = 0; k < query.classes.length; k++){
				var cls = query.classes[k];
				
				allClassesMatch = allClassesMatch && element.hasClass(cls);
				
				if( !allClassesMatch ) break;
			}
			if( !allClassesMatch ) return false;
			
			// generic checking for data/metadata
			function operandsMatch(params){
				var allDataMatches = true;
				for(var k = 0; k < query[params.name].length; k++){
					var data = query[params.name][k];
					var operator = data.operator;
					var value = data.value;
					var field = data.field;
					var matches;
					
					if( operator != null && value != null ){
						
						var fieldStr = "" + params.fieldValue(field);
						var valStr = "" + eval(value);
						
						var caseInsensitive = false;
						if( operator.charAt(0) == "@" ){
							fieldStr = fieldStr.toLowerCase();
							valStr = valStr.toLowerCase();
							
							operator = operator.substring(1);
							caseInsensitive = true;
						}
						
						if( operator == "=" ){
							operator = "==";
						}
						
						switch(operator){
						case "*=":
							matches = fieldStr.search(valStr) >= 0;
							break;
						case "$=":
							matches = new RegExp(valStr + "$").exec(fieldStr) != null;
							break;
						case "^=":
							matches = new RegExp("^" + valStr).exec(fieldStr) != null;
							break;
						default:
							// if we're doing a case insensitive comparison, then we're using a STRING comparison
							// even if we're comparing numbers
							if( caseInsensitive ){
								// eval with lower case strings
								var expr = "fieldStr " + operator + " valStr";
								matches = eval(expr);
							} else {
								// just eval as normal
								var expr = params.fieldRef(field) + " " + operator + " " + value;
								matches = eval(expr);
							}
							
						}
					} else if( operator != null ){
						switch(operator){
						case "?":
							matches = params.fieldTruthy(field);
							break;
						case "!":
							matches = !params.fieldTruthy(field);
							break;
						case "^":
							matches = params.fieldUndefined(field);
							break;
						}
					} else { 	
						matches = !params.fieldUndefined(field);
					}
					
					if( !matches ){
						allDataMatches = false;
						break;
					}
				} // for
				
				return allDataMatches;
			} // operandsMatch
			
			// check data matches
			var allDataMatches = operandsMatch({
				name: "data",
				fieldValue: function(field){
					return element._private.data[field];
				},
				fieldRef: function(field){
					return "element._private.data." + field;
				},
				fieldUndefined: function(field){
					return element._private.data[field] === undefined;
				},
				fieldTruthy: function(field){
					if( element._private.data[field] ){
						return true;
					}
					return false;
				}
			});
			
			if( !allDataMatches ){
				return false;
			}
			
			// check metadata matches
			var allMetaMatches = operandsMatch({
				name: "meta",
				fieldValue: function(field){
					return element[field]();
				},
				fieldRef: function(field){
					return "element." + field + "()";
				},
				fieldUndefined: function(field){
					return element[field]() == undefined;
				},
				fieldTruthy: function(field){
					if( element[field]() ){
						return true;
					}
					return false;
				}
			});
			
			if( !allMetaMatches ){
				return false;
			}
			
			// check collection
			if( query.collection != null ){
				var matchesAny = query.collection._private.ids[ element.id() ] != null;
				
				if( !matchesAny ){
					return false;
				}
			}
			
			// check filter function
			if( query.filter != null && element.collection().filter( query.filter ).size() == 0 ){
				return false;
			}
			

			// check parent/child relations
			function confirmRelations( query, elements ){
				if( query != null ){
					var matches = false;
					elements = elements(); // make elements functional so we save cycles if query == null

					// query must match for at least one element (may be recursive)
					for(var i = 0; i < elements.size(); i++){
						if( queryMatches( query, elements.eq(i) ) ){
							matches = true;
							break;
						}
					}

					return matches;
				} else {
					return true;
				}
			}

			if (! confirmRelations(query.parent, function(){
				return element.parent()
			}) ){ return false }

			if (! confirmRelations(query.ancestor, function(){
				return element.parents()
			}) ){ return false }

			if (! confirmRelations(query.child, function(){
				return element.children()
			}) ){ return false }

			if (! confirmRelations(query.descendant, function(){
				return element.descendants()
			}) ){ return false }

			// we've reached the end, so we've matched everything for this query
			return true;
		}; // queryMatches

		var selectorFunction = function(i, element){
			for(var j = 0; j < self.length; j++){
				var query = self[j];
				
				if( queryMatches(query, element) ){
					return true;
				}
			}
			
			return false;
		};
		
		if( self._private.selectorText == null ){
			selectorFunction = function(){ return true; };
		}
		
		var filteredCollection = collection.filter( selectorFunction );
		
		return filteredCollection;
	}; // filter
	
	// ith query to string
	$$.selfn.toString = $$.selfn.selector = function(){
		
		var str = "";
		
		function clean(obj){
			if( $$.is.string(obj) ){
				return obj;
			} 
			return "";
		}
		
		function queryToString(query){
			var str = "";

			var group = clean(query.group);
			str += group.substring(0, group.length - 1);
			
			for(var j = 0; j < query.data.length; j++){
				var data = query.data[j];
				str += "[" + data.field + clean(data.operator) + clean(data.value) + "]"
			}

			for(var j = 0; j < query.meta.length; j++){
				var meta = query.meta[j];
				str += "{" + meta.field + clean(meta.operator) + clean(meta.value) + "}"
			}
			
			for(var j = 0; j < query.colonSelectors.length; j++){
				var sel = query.colonSelectors[i];
				str += sel;
			}
			
			for(var j = 0; j < query.ids.length; j++){
				var sel = "#" + query.ids[i];
				str += sel;
			}
			
			for(var j = 0; j < query.classes.length; j++){
				var sel = "." + query.classes[i];
				str += sel;
			}

			if( query.parent != null ){
				str = queryToString( query.parent ) + " > " + str; 
			}

			if( query.ancestor != null ){
				str = queryToString( query.ancestor ) + " " + str; 
			}

			if( query.child != null ){
				str += " > " + queryToString( query.child ); 
			}

			if( query.descendant != null ){
				str += " " + queryToString( query.descendant ); 
			}

			return str;
		}

		for(var i = 0; i < this.length; i++){
			var query = this[i];
			
			str += queryToString( query );
			
			if( this.length > 1 && i < this.length - 1 ){
				str += ", ";
			}
		}
		
		return str;
	};
	
})(jQuery, jQuery.cytoscape);

;(function($, $$){
		
	function NullRenderer(options){
	}
	
	NullRenderer.prototype.notify = function(params){
	};
	
	NullRenderer.prototype.zoom = function(params){
	};
	
	NullRenderer.prototype.fit = function(params){
	};
	
	NullRenderer.prototype.pan = function(params){
	};
	
	NullRenderer.prototype.panBy = function(params){
	};
	
	NullRenderer.prototype.showElements = function(element){
	};
	
	NullRenderer.prototype.hideElements = function(element){
	};
	
	NullRenderer.prototype.elementIsVisible = function(element){
		return element._private.visible;
	};
	
	NullRenderer.prototype.renderedDimensions = function(){
		return {};
	};

	NullRenderer.prototype.dimensions = function(){
		return {};
	};
	
	$$("renderer", "null", NullRenderer);
	
})(jQuery, jQuery.cytoscape);

(function($, $$){

	var defaults = {
		minZoom: 0.001,
		maxZoom: 1000,
		maxPan: -1 >>> 1,
		minPan: (-(-1>>>1)-1),
		selectionToPanDelay: 500,
		dragToSelect: true,
		dragToPan: true
	};
	
	var lineStyles = {};
	
	var registerLineStyle = function(style){
		$.cytoscape("renderer", "svg", "linestyle", style.name, style);
		delete style.name;
	};
	
	registerLineStyle({
		name: "solid",
		array: undefined
	});
	
	registerLineStyle({
		name: "dot",
		array: [1, 5]
	});
	
	registerLineStyle({
		name: "longdash",
		array: [10, 2]
	});
	
	registerLineStyle({
		name: "dash",
		array: [5, 5]
	});
	
	var registerEdgeArrowShape = function(shape){
		$.cytoscape("renderer", "svg", "edgearrowshape", shape.name, shape);
		delete shape.name;
	};
	
	registerEdgeArrowShape({
		name: "triangle",
		
		// generate the shape svg
		// the top points towards the node
		svg: function(svg, parent, edge, position, style){
			return svg.polygon(parent, [[0, 1], [0.5, 0], [1, 1]]);
		},
		
		// the point within the 1x1 box to line up with the center point at the
		// end of the edge
		centerPoint: {
			x: 0.5,
			y: 0.5
		}
	});
	
	registerEdgeArrowShape({
		name: "square",
		
		// generate the shape svg
		svg: function(svg, parent, edge, position, style){
			return svg.polygon(parent, [[0, 0], [0, 1], [1, 1], [1, 0]]);
		},
		
		centerPoint: {
			x: 0.5,
			y: 0.5
		}
	});
	
	registerEdgeArrowShape({
		name: "circle",
		
		// generate the shape svg
		svg: function(svg, parent, edge, position, style){
			return svg.circle(parent, 0.5, 0.5, 0.5);
		},
		
		centerPoint: {
			x: 0.5,
			y: 0.5
		}
	});

	registerEdgeArrowShape({
		name: "diamond",
		
		// generate the shape svg
		svg: function(svg, parent, edge, position, style){
			return svg.polygon(parent, [[0.5, 0], [1, 0.5], [0.5, 1], [0, 0.5]]);
		},
		
		centerPoint: {
			x: 0.5,
			y: 0.5
		}
	});

	registerEdgeArrowShape({
		name: "tee",
		
		// generate the shape svg
		svg: function(svg, parent, edge, position, style){
			return svg.rect(parent, 0, 0, 1, 0.5);
		},
		
		centerPoint: {
			x: 0.5,
			y: 0.5
		}
	});
	
	var registerNodeShape = function(shape){
		$.cytoscape("renderer", "svg", "nodeshape", shape.name, shape);
		delete shape.name;
	};
	
	// use this as an example for adding more node shapes
	registerNodeShape({
		// name of the shape
		name: "ellipse",
		
		// generate the shape svg
		svg: function(svg, parent, node, position, style){
			return svg.ellipse(parent, position.x, position.y, style.width.pxValue, style.height.pxValue);
		},
		
		// update unique style attributes for this shape
		// see http://keith-wood.name/svgRef.html for api reference
		update: function(svg, parent, node, position, style){
			svg.change(node.rscratch("svg"), {
				cx: position.x,
				cy: position.y,
				rx: style.width.pxValue / 2,
				ry: style.height.pxValue / 2
			});
		},
		
		// 2D shape in intersection lib
		intersectionShape: Ellipse
	});
	
	registerNodeShape({
		name: "rectangle",
		svg: function(svg, parent, node, position, style){
			return svg.rect(parent, position.x - style.width.pxValue/2, position.y - style.height.pxValue/2, style.width.pxValue, style.height.pxValue);
		},
		update: function(svg, parent, node, position, style){
			svg.change(node.rscratch("svg"), {
				x: position.x - style.width.pxValue/2,
				y: position.y - style.height.pxValue/2,
				width: style.width.pxValue,
				height: style.height.pxValue
			});
		},
		
		intersectionShape: Rectangle
	});
	
	registerNodeShape({
		name: "roundrectangle",
		svg: function(svg, parent, node, position, style){
			return svg.rect(parent, position.x - style.width.pxValue/2, position.y - style.height.pxValue/2, style.width.pxValue, style.height.pxValue, style.width.pxValue/4, style.height.pxValue/4);
		},
		update: function(svg, parent, node, position, style){
			svg.change(node.rscratch("svg"), {
				x: position.x - style.width/2,
				y: position.y - style.height/2,
				width: style.width.pxValue,
				height: style.height.pxValue
			});
		},
		
		intersectionShape: Rectangle
	});
	
	registerNodeShape({
		name: "triangle",
		svg: function(svg, parent, node, position, style){
			return svg.polygon(parent,
					           [ 
					             [position.x,                 position.y - style.height.pxValue/2], 
					             [position.x + style.width.pxValue/2, position.y + style.height.pxValue/2],
					             [position.x - style.width.pxValue/2, position.y + style.height.pxValue/2]
					           ]);
		},
		update: function(svg, parent, node, position, style){
			svg.change(node.rscratch("svg"), {
				points: [ 
			             [position.x,                 position.y - style.height.pxValue/2], 
			             [position.x + style.width.pxValue/2, position.y + style.height.pxValue/2],
			             [position.x - style.width.pxValue/2, position.y + style.height.pxValue/2]
			           ]
			});
		},
		
		intersectionShape: Polygon
	});
	
	function visibility(v){
		if( v != null && typeof v == typeof "" && ( v == "hidden" || v == "visible" ) ){
			return v;
		} else {
			//$.error("SVG renderer does not recognise %o as a valid visibility", v);
		}
	};
	
	function percent(p){
		if( p != null && typeof p == typeof 1 && !isNaN(p) &&  0 <= p && p <= 1 ){
			return p;
		} else {
			//$.error("SVG renderer does not recognise %o as a valid percent (should be between 0 and 1)", p);
		}
	}
	
	function color(c){
		if( c != null && typeof c == typeof "" && $.Color(c) != "" ){
			return $.Color(c).toHEX();
		} else {
			//$.error("SVG renderer does not recognise %o as a valid colour", c);
		}
	}
	
	function number(n){
		if( n != null && typeof n == typeof 1 && !isNaN(n) ){
			return n;
		} else {
			//$.error("SVG renderer does not recognise %o as a valid number", n);
		}
	}
	
	function nodeShape(name){
		var ret = $.cytoscape("renderer", "svg", "nodeshape", name);
		
		if( ret == null ){
			//$.error("SVG renderer does not recognise %s as a valid node shape", name);
		}
		
		return ret;
	}
	
	function lineStyle(name){
		var ret = $.cytoscape("renderer", "svg", "linestyle", name);
		
		if( ret == null ){
			//$.error("SVG renderer does not recognise %s as a valid line style", name);
		}
		
		return ret;
	}
	
	function edgeArrowShape(name){
		if( name == "none" || name == null ){
			return null;
		}
		
		return $.cytoscape("renderer", "svg", "edgearrowshape", name);
	}
	
	function labelHalign(a){
		if( a != null && typeof a == typeof "" && ( a == "left" || a == "right" || a == "middle" ) ){
			return a;
		} else {
			//$.error("SVG renderer does not recognise %o as a valid label horizonal alignment", a);
		}	
	}
	
	function labelValign(a){
		if( a != null && typeof a == typeof "" && ( a == "top" || a == "bottom" || a == "middle" ) ){
			return a;
		} else {
			//$.error("SVG renderer does not recognise %o as a valid label vertical alignment", a);
		}	
	}
	
	function cursor(name){
		if( name == "grab" ){
			if( $.browser.webkit ){
				return "-webkit-grab";
			} else if( $.browser.mozilla ){
				return "-moz-grab";
			} else {
				return "move";
			}
		} else if( name == "grabbing" ){
			if( $.browser.webkit ){
				return "-webkit-grabbing";
			} else if( $.browser.mozilla ){
				return "-moz-grabbing";
			} else {
				return "move";
			}
		} else {
			return name;
		}
	}
	
	function SvgRenderer(options){
		
		this.options = $.extend({}, defaults, options);
		this.setStyle(options.style);
		this.cy = options.cy;
		
		
		
	}
	
	SvgRenderer.prototype.init = function(callback){
		var self = this;
		this.cy = this.options.cy;
		var container = this.cy.container();
		var svg = container.svg('get'); 
		
		this.container = container;
		this.svg = svg;
		
		if( svg != null ){
			container.svg('destroy');
		} 
		
		container.css({
			padding: "0 !important"
		});
		
		container.svg({
			onLoad: function(s){
				
				if( self.scale == null ){
					self.scale = 1;
				}
				if( self.translation == null ){
					self.translation = { x: 0, y: 0 };
				}
				
				container.find("svg").css("overflow", "hidden"); // fixes ie overflow
				
				svg = s;
				self.svg = svg;
				
				self.svg.change();
				
				self.svgBg = svg.rect(0, 0, "100%", "100%", {
					fill: "white", // any arbitrary colour
					opacity: 0 // don't show the bg rect but let it bubble up events
				});
				
				self.edgesGroup = svg.group();
				self.nodesGroup = svg.group();
				self.svgRoot = $(self.nodesGroup).parents("svg:first")[0];
				
				
				self.selectedElements = self.cy.collection();
				self.touchingNodes = self.cy.collection();
				
				self.defs = self.svg.defs();
				
				self.makeBackgroundInteractive();
				
				callback();
			},
			settings: {
				height: "100%",
				width: "100%"
			}
		});
		
	};
	
	SvgRenderer.prototype.offsetFix = function(e){
		var self = this;
		
		// firefox fix :(
		if( e.offsetX == null || e.offsetY == null ){
			e.offsetX = e.pageX - self.cy.container().offset().left;
			e.offsetY = e.pageY - self.cy.container().offset().top;
		}
	};
	
	SvgRenderer.prototype.makeBackgroundInteractive = function(){
		
		var self = this;
		
		var svgDomElement = self.svgRoot;
		var panDelay = self.options.selectionToPanDelay;
		var mover = false;
		var moverThenMoved = false;
		var mmovedScreenPos = {
			x: null,
			y: null
		};
		var mmovedScreenTolerance = 0;
		
		self.shiftDown = false;
		$(window).bind("keydown keyup", function(e){
			self.shiftDown = e.shiftKey;
		});
		
		function backgroundIsTarget(e){
			return e.target == svgDomElement 
				|| $(e.target).parents("g:last")[0] == self.edgesGroup
				|| $(e.target)[0] == self.svgBg;
		}
		
		$(window).bind("blur", function(){
			mover = false;
			moverThenMoved = false;
		}).bind("mousemove", function(e){
			var diffScreenPos = false;
			if( Math.abs(e.screenX - mmovedScreenPos.x) > mmovedScreenTolerance
			|| Math.abs(e.screenY - mmovedScreenPos.y) > mmovedScreenTolerance ){
				diffScreenPos = true;
			}
			
			mmovedScreenPos = {
				x: e.screenX,
				y: e.screenY
			};

			if( mover && diffScreenPos ){
				moverThenMoved = true;
			}
		});

		$(svgDomElement).bind("mousedown", function(mousedownEvent){

			// ignore right clicks
			if( mousedownEvent.button != 0 ){
				return;
			}
			
			if( backgroundIsTarget(mousedownEvent) ){
				
				mousedownEvent.preventDefault();
				
				self.offsetFix(mousedownEvent);
				
				var selectionSquare = null;
				var selectionBounds = {};
				
				var panning = true;
				var selecting = true;
				
				if( !self.options.dragToSelect ){
					selecting = false;
				}
				
				if( !self.options.dragToPan ){
					panning = false;
				}
				
				if( panning && selecting ){
					panning = false;
					selecting = true;
				}
				
				var originX = mousedownEvent.pageX;
				var originY = mousedownEvent.pageY;
				
				var selectOriginX = mousedownEvent.offsetX;
				var selectOriginY = mousedownEvent.offsetY;
				var selectDx = 0;
				var selectDy = 0;
				
				var _setPanCursor = false;
				function setPanCursor(){
					var coreStyle = self.cy.style().core();
					if( _setPanCursor ){ return; }
					
					_setPanCursor = true;
					self.svg.change(svgDomElement, {
						cursor: coreStyle["panning-cursor"].value
					});
				}
				
				if( self.options.dragToPan ){
					var panDelayTimeout = setTimeout(function(){
						if( !self.cy.panningEnabled() ){
							return;
						}
						
						panning = true;
						selecting = false;
						
					}, panDelay);
				}
				
				var dragHandler = function(dragEvent){
					clearTimeout(panDelayTimeout);
					var coreStyle = self.cy.style().core();
					
					var dx = dragEvent.pageX - originX;
					var dy = dragEvent.pageY - originY;
					
					// new origin each event
					originX = dragEvent.pageX;
					originY = dragEvent.pageY;
					
					selectDx += dx;
					selectDy += dy;
					
					if( panning ){	
						var newPan = {
							x: self.translation.x + dx,
							y: self.translation.y + dy
						};

						setPanCursor();
						
						self.pan(newPan);
					}
					
					if( selecting ){
						if( selectionSquare == null ){
							selectionSquare = self.svg.rect(selectOriginX, selectOriginY, 0, 0, {
								fill: coreStyle["selection-box-color"].strValue,
								opacity: coreStyle["selection-box-opacity"].value,
								stroke: coreStyle["selection-box-border-color"].strValue,
								strokeWidth: coreStyle["selection-box-border-width"].value
							});
						} else {
							
							var width = Math.abs(selectDx);
							var height = Math.abs(selectDy);
							var x = selectDx >= 0 ? selectOriginX : selectOriginX + selectDx;
							var y = selectDy >= 0 ? selectOriginY : selectOriginY + selectDy;
							
							selectionBounds = {
								x1: x,
								y1: y,
								x2: x + width,
								y2: y + height
							};
							
							self.svg.change(selectionSquare, {
								x: x,
								y: y,
								width: width,
								height: height
							});
						}
					}
				};
				
				$(window).bind("mousemove", dragHandler);
				
				var endHandler = function(mouseupEvent){
					
					// ignore right clicks
					if( mouseupEvent.type == "mouseup" && mouseupEvent.button != 0 ){
						return;
					}
					
					clearTimeout(panDelayTimeout);
					
					$(window).unbind("mousemove", dragHandler);
	
					$(window).unbind("mouseup", endHandler);
					$(window).unbind("blur", endHandler);
					$(svgDomElement).unbind("mouseup", endHandler);
					
					if( panning ){
						self.svg.change(svgDomElement, {
							cursor: null
						});
					}
					
					if( selecting ){
						if( selectionSquare != null && selectionBounds.x1 != null && !isNaN(selectionBounds.x1) ){
							self.selectElementsFromIntersection(selectionSquare, selectionBounds);
							self.svgRemove(selectionSquare);
						} else if( !self.shiftDown ) {
							self.unselectAll();
						}
					}
					
				};
				
				$(window).bind("mouseup", endHandler);
				$(window).bind("blur", endHandler);
				$(svgDomElement).bind("mouseup", endHandler);
			}
		}).bind("mouseover", function(){
			mover = true;
			moverThenMoved = false;
		}).bind("mouseout", function(){
			mover = false;
			moverThenMoved = false;
		}).bind("mousewheel", function(e, delta, deltaX, deltaY){
			if( !self.cy.panningEnabled() || !self.cy.zoomingEnabled() || !moverThenMoved ){
				return;
			}

			self.offsetFix(e.originalEvent);

			var point = {
				x: e.originalEvent.offsetX,
				y: e.originalEvent.offsetY
			};
			
			var deltaFactor = 0.5;
			
			if( $.browser.mozilla || $.browser.msie ){
				deltaFactor = 0.167;
			}
			
			var zoom = self.zoom() * (1 + deltaY * deltaFactor);
			
			self.zoomAboutPoint(point, zoom);
			self.cy.trigger("zoom");
			self.cy.trigger("pan");
			
			e.preventDefault();
		});
		
		// touch functions (& touch support)
		//       |
		//       v
		
		function point(e, i){
			var x, y;
			var offset = self.cy.container().offset();
			var touches = e.originalEvent.touches;
			var touch = touches[ i ];
			
			x = touch.pageX - offset.left;
			y = touch.pageY - offset.top;
			
			return { x: x, y: y };
		}
		
		function centerPoint(e){
			var p1 = point(e, 0);
			var p2 = point(e, 1);
			
			return {
				x: (p1.x + p2.x)/2,
				y: (p1.y + p2.y)/2
			};
		}
		
		function distance(e){
			var p1 = point(e, 0);
			var p2 = point(e, 1);
			
			return self.getDistance(p1, p2);
		}
		
		function numEventPoints(e){
			return e.originalEvent.touches == null ? 0 : e.originalEvent.touches.length;
		}
		
		function pointsAtLeast(e, n){
			return numEventPoints(e) >= n;
		}
		
		function fingers(n){
			if( n >= 2 ){
				twoFingers = true;
				inTwoFingerDelay = true;
				
				clearTimeout(twoFingersTimeout);
				twoFingersTimeout = setTimeout(function(){
					inTwoFingerDelay = false;
				}, delayFrom2FingersTo1);
			} else {
				twoFingers = false;
			}
		}
		
		var delayFrom2FingersTo1 = 100;
		var twoFingers = false;
		var inTwoFingerDelay = false;
		var twoFingersTimeout = null;
		var touchendUnselects = true;
		var center, modelCenter, distance1, point11, point12, point21, point22, movedAfterTouchStart;
		$(svgDomElement).bind("touchstart", function(tsEvent){
			if( !backgroundIsTarget(tsEvent) || self.touchingNodes.size() > 0 ){
				return;	
			}
			
			tsEvent.preventDefault();
			point11 = point(tsEvent, 0);
			
			if( pointsAtLeast(tsEvent, 2) ){
				center = centerPoint(tsEvent);
				modelCenter = self.modelPoint(center);
				distance1 = distance(tsEvent);
				point12 = point(tsEvent, 1);
				fingers(2);
			} else {
				fingers(1);
				touchendUnselects = true;
			}
			
			movedAfterTouchStart = false;
			
		}).bind("touchmove", function(tmEvent){
			if( !backgroundIsTarget(tmEvent) || self.touchingNodes.size() > 0 ){
				return;	
			}
			
			touchendUnselects = false;
			
			if( pointsAtLeast(tmEvent, 2) ){
				fingers(2);
				point22 = point(tmEvent, 1);
			} else {
				fingers(1);
			}
			
			tmEvent.preventDefault();

			var translation = {
				x: 0,
				y: 0
			};
			
			if( pointsAtLeast(tmEvent, 1) && self.cy.panningEnabled() ){
				point21 = point(tmEvent, 0);
				
				if( pointsAtLeast(tmEvent, 2) && self.cy.zoomingEnabled() ){
					var distance2 = distance(tmEvent);
					//center = self.renderedPoint(modelCenter);
					var factor = distance2 / distance1;
					center = self.renderedPoint(modelCenter);
					
					if( factor != 1 ){
						var speed = 1.5;
						
						// delta finger 1
						var d1 = {
							x: point21.x - point11.x,
							y: point21.y - point11.y
						};
						
						// delta finger 2
						var d2 = {
							x: point22.x - point12.x,
							y: point22.y - point12.y
						};
						
						// translation is the normalised vector of the two fingers movement
						// i.e. so pinching cancels out and moving together pans
						translation = {
							x: (d1.x + d2.x) / 2,
							y: (d1.y + d2.y) / 2
						};
						
						if( factor > 1 ){
							factor = (factor - 1) * speed + 1;
						} else {
							factor = 1 - (1 - factor) * speed;
						}
						
						var zoom = self.zoom() * factor;
						
						self.zoomAboutPoint(center, zoom, translation);
						distance1 = distance2;
					}
				} else if( !inTwoFingerDelay ){
					translation = {
						x: point21.x - point11.x,
						y: point21.y - point11.y
					};
					
					self.panBy(translation);
				}
				
				point11 = point21;
				point12 = point22;
			}
		}).bind("touchend", function(teEvent){
			if( touchendUnselects && backgroundIsTarget(teEvent) ){
				self.unselectAll();
			}
		});
		
		$(svgDomElement).bind("mousedown mouseup click mouseover mouseout mousemove touchstart touchmove touchend", function(e){
			
			// only pass along if bg is the target: when an element gets an event, it automatically bubbles up to
			// core and bg via the core (Element) logic
			if( backgroundIsTarget(e) ){
				var event = e;
				self.cy.trigger(event);
			}
		});
		
	};
	
	SvgRenderer.prototype.zoomAboutPoint = function(point, zoom, translation){
		var self = this;
		var cy = self.cy;
		
		if( !cy.panningEnabled() || !cy.zoomingEnabled() ){
			return;
		}
		
		var pan1 = self.pan();
		var zoom1 = self.zoom();
		var zoom2 = zoom;
		
		if( translation == null ){
			translation = {
				x: 0,
				y: 0
			};
		}
		
		var pan2 = {
			x: -zoom2/zoom1 * (point.x - pan1.x - translation.x) + point.x,
			y: -zoom2/zoom1 * (point.y - pan1.y - translation.y) + point.y
		};
		
		self.transform({
			translation: pan2,
			scale: zoom2
		});
	};
	
	SvgRenderer.prototype.zoom = function(scale){
		
		var cy = this.cy;
		
		if( !cy.zoomingEnabled() ){
			return;
		}
		
		if( scale === undefined ){
			return this.scale;
		} else if( typeof scale == typeof {} ){
			var options = scale;
			var rposition;
			
			if( options.position !== undefined ){
				rposition = this.renderedPoint(options.position);
			} else {
				rposition = options.renderedPosition;
			}
			
			if( rposition !== undefined ){
				this.zoomAboutPoint(rposition, scale.level);
			} else {
				this.transform({
					scale: options.level
				});
			}
			
		} else {
			this.transform({
				scale: scale
			});
		} 

	};
	
	SvgRenderer.prototype.fit = function(params){
		var elements = params.elements;
		var zoom = params.zoom;
		var cy = this.cy;
		
		if( !cy.panningEnabled() || (zoom !== undefined && !cy.zoomingEnabled()) ){
			return;
		}
		
		if( elements == null || elements.size() == 0 ){
			elements = this.cy.elements();
		}
		
		if( elements.is(":removed") ){
			
			elements = elements.filter(":inside");
		}
		
		
		
		var n = this.nodesGroup.getBBox();
		//var e = this.edgesGroup.getBBox();
		
		var x1, y1, x2, y2;
		
		function update(bb){
			if( bb.height == 0 || bb.width == 0 ){ return; }

			var left = bb.x;
			var right = left + bb.width;
			var top = bb.y;
			var bottom = top + bb.height;
			
			if( left < x1 || x1 == null ){
				x1 = left;
			}
			
			if( right > x2 || x2 == null ){
				x2 = right;
			}
			
			if( top < y1 || y1 == null ){
				y1 = top;
			}
			
			if( bottom > y2 || y2 == null ){
				y2 = bottom;
			} 
		}

		elements.nodes().each(function(){
			var bb = this.rscratch("svg").getBBox();
			var bbLabel = this.rscratch("svgLabel").getBBox();

			update(bb);
			update(bbLabel);
		});

		// fix for loop edges (their bounding boxes are approx 2x width and height of path
		// they push the bb up and left
		elements.edges().each(function(){
			var src = this.source().id();
			var tgt = this.target().id();
			var loopFactor = lf = 0.4;
			
			if( src == tgt ){
				var bb = this.rscratch("svg").getBBox();
				bb.x2 = bb.x + bb.width;
				bb.y2 = bb.y + bb.height;
				bb.x1 = bb.x;
				bb.y1 = bb.y;

				var bbAdjusted = {};
				bbAdjusted.x = bb.x1 + bb.width * lf;
				bbAdjusted.y = bb.y1 + bb.height * lf;
				bbAdjusted.width = bb.x2 - bbAdjusted.x;
				bbAdjusted.height = bb.y2 - bbAdjusted.y;

				var bbLabel = this.rscratch("svgLabel").getBBox();

				update(bbAdjusted);
				update(bbLabel);
			} else {
				var bb = this.rscratch("svg").getBBox();
				var bbLabel = this.rscratch("svgLabel").getBBox();

				update(bb);
				update(bbLabel);
			}
		});
		
		var w = x2 - x1;
		var h = y2 - y1;

		var width = this.cy.container().width();
		var height = this.cy.container().height();
		
		var scale = Math.min( width/w, height/h );
		
		if( zoom ){
			this.transform({
				translation: {
					x: -x1 * scale - (w*scale - width)/2,
					y: -y1 * scale - (h*scale - height)/2
				},
				scale: scale
			});
		} else {
			var z = this.scale;
			
			this.transform({
				translation: {
					x: -x1*z + width/2 - (x2-x1)/2*z,
					y: -y1*z + height/2 - (y2-y1)/2*z
				}
			});
		}
		
	};
	
	SvgRenderer.prototype.panBy = function(position){
		if( !this.cy.panningEnabled() ){
			return;
		}
		
		this.transform({
			translation: {
				x: this.translation.x + number(position.x),
				y: this.translation.y + number(position.y)
			}
		});
	};
	
	SvgRenderer.prototype.pan = function(position){
		if( !this.cy.panningEnabled() ){
			return;
		}
		
		if( position === undefined ){
			return {
				x: this.translation.x,
				y: this.translation.y
			};
		}
		
		if( position == null || typeof position != typeof {} ){
			//$.error("You can not pan without specifying a proper position object; `%o` is invalid", position);
			return;
		}
		
		this.transform({
			translation: {
				x: number(position.x),
				y: number(position.y)
			}
		});
	};
	
	SvgRenderer.prototype.capTransformation = function(params){
		var translation = params.translation;
		var scale = params.scale;
		var self = this;
		
		var maxScale = self.options.maxZoom;
		var minScale = self.options.minZoom;
		var minTranslation = self.options.minPan;
		var maxTranslation = self.options.maxPan;
		var validScale = true;
		var validTranslation = true;
		
		if( translation != null ){
			if( translation.x < minTranslation ){
				translation.x = minTranslation;
				validTranslation = false;
			} else if( translation.x > maxTranslation ){
				translation.x = maxTranslation;
				validTranslation = false;
			}
			
			if( translation.y < minTranslation ){
				translation.y = minTranslation;
				validTranslation = false;
			} else if( translation.y > maxTranslation ){
				translation.y = maxTranslation;
				validTranslation = false;
			}

		} else {
			translation = self.translation;
		}
		
		if( scale != null ){
			if( scale > maxScale ){
				scale = maxScale;
				validScale = false;
			} else if( scale < minScale ){
				scale = minScale;
				validScale = false;
			}
		} else {
			scale = self.scale;
		}
		
		return {
			scale: scale,
			translation: translation,
			valid: validScale && validTranslation,
			validScale: validScale,
			validTranslation: validTranslation
		};
	};
	
	SvgRenderer.prototype.transform = function(params){
		var self = this;
		
		var capped = self.capTransformation(params);
		
		var oldScale = self.scale;
		var oldTranslation = {
			x: self.translation ? self.translation.x : undefined,
			y: self.translation ? self.translation.y : undefined
		};

		if( capped.valid ){
			self.translation = capped.translation;
			self.scale = capped.scale;
		} else {
		
			if( params.capScale ){
				
				self.scale = capped.scale;
			}
			
			if( params.capTranslation ){
				
				self.translation = capped.translation;
			}
		}
		
		function transform(svgElement){
			if( self.svg == null || svgElement == null ){
				return;
			}
			
			self.svg.change(svgElement, {
				transform: "translate(" + self.translation.x + "," + self.translation.y + ") scale(" + self.scale + ")"
			});
		}
		
		transform(self.nodesGroup);
		transform(self.edgesGroup);

		if( self.scale === undefined || oldScale !== self.scale ){
			cy._private.zoom = self.scale;
			self.cy.trigger("zoom");
		}

		if( self.translation === undefined || oldTranslation.x !== self.translation.x || oldTranslation.y !== self.translation.y ){
			cy._private.pan = self.translation;
			self.cy.trigger("pan");
		}
	};

	// update viewport when core sends us updates
	SvgRenderer.prototype.updateViewport = function(){
		var zoom = this.cy.zoom();
		var pan = this.cy.pan();

		this.transform({
			scale: zoom,
			translation: pan
		});
	};
	
	SvgRenderer.prototype.calculateStyleField = function(element, fieldName){
		var self = this;
		var styleCalculator = self.options.styleCalculator;
		var selectors = self.style.selectors;
		
		var field = undefined;
		var bypassField = element.bypass()[fieldName];
		
		if( bypassField !== undefined ){
			field = bypassField;
		} else {
			$.each(selectors, function(selector, selStyle){
				var selField = selStyle[fieldName];
				
				if( selField != null && element.is(selector) ){
					field = selField;
				}
			});
		}
		
		return styleCalculator.calculate(element, field);
	};
	
	SvgRenderer.prototype.calculateStyle = function(element){
		var self = this;
		var styleCalculator = self.options.styleCalculator;
		var selectors = self.style.selectors;
		var style = {};
		
		// iteratively set style based on matching selectors
		$.each(selectors, function(selector, selStyle){
			if( element.is(selector) ){
				style = $.extend(style, selStyle);
			}
		});
		
		// apply the bypass
		style = $.extend(style, element.bypass());
		
		// compute the individual values (i.e. flatten mappers to actual values)
		$.each(style, function(styleName, styleVal){
			style[styleName] = styleCalculator.calculate(element, styleVal);
		});
		
		// assign to computed style field
		element._private.style = style;
		
		if( element.isEdge() ){
			var source = element.source();
			var target = element.target();
			
			function calculateVisibility(){
				if( source.style("visibility") == "visible" && target.style("visibility") == "visible" ){
					return visibility(style.visibility);
				} else {
					return "hidden";
				}
			}
			
			style.visibility = calculateVisibility();
		}
		
		return style;
	};
	
	SvgRenderer.prototype.svgRemove = function(svg){
		var $svg = $(svg);
		var $container = $(this.svgRoot);
		
		function svgIsInCy( svgDomElement ){
			var $ele = $(svgDomElement);
			var inside = false;
			
			if( $ele.parent().size() == 0 ){
				return false; // more efficient :)
			}
			
			$ele.parents().each(function(){
				if( this == $container[0] ){
					inside = true;
				}
			});
			
			return inside;
		}
		
		if( svg == null || !svgIsInCy(svg) ){
			return;
		}
		
		this.svg.remove( svg );
	};
	
	SvgRenderer.prototype.updateNodePositionFromShape = function(element){
		var style = element._private.style;
		var parent = element.rscratch("svgGroup");
		var position = element.position();
		
		nodeShape(style.shape.strValue).update(this.svg, parent, element, position, style);
	};
	
	SvgRenderer.prototype.makeSvgEdgeInteractive = function(element){
		var svgDomElement = element.rscratch("svg");
		var targetArrow = element.rscratch("svgTargetArrow");
		var sourceArrow = element.rscratch("svgSourceArrow");
		var svgCanvas = $(svgDomElement).parents("svg:first")[0];
		var self = this;
		
		$(svgDomElement).add(targetArrow).add(sourceArrow).bind("mouseup mousedown click touchstart touchmove touchend mouseover mousemove mouseout", function(e){
			if( self.edgeEventIsValid(element, e) ){
				element.trigger(e);
			}
		}).bind("click touchend", function(e){
			self.selectElement(element);
		});
	};
	
	SvgRenderer.prototype.makeSvgNodeLabelInteractive = function(element){
	};
	

	SvgRenderer.prototype.makeSvgNodeInteractive = function(element){
		var svgDomElement = element.rscratch("svg");
		var svgCanvas = $(svgDomElement).parents("svg:first")[0];
		var self = this;
		var draggedAfterMouseDown = null;
		
		// you need to prevent default event handling to 
		// prevent built-in browser drag-and-drop etc
		
		$(svgDomElement).bind("mousedown touchstart", function(mousedownEvent){
			draggedAfterMouseDown = false;
			
			element.trigger(mousedownEvent);
			
			if( element.grabbed() || element.locked() || !element.grabbable() ){
				mousedownEvent.preventDefault();
				return;
			}
			
			if( mousedownEvent.type == "touchstart" && mousedownEvent.originalEvent.touches.length > 1 ){
				return;
			}
			 
			element._private.grabbed = true;
			element.trigger($.extend({}, mousedownEvent, { type: "grab" }));
			self.touchingNodes = self.touchingNodes.add(element);
			
			var originX, originY;
			
			if( mousedownEvent.type == "touchstart" ){
				var touches = mousedownEvent.originalEvent.touches;
				var touch = touches[touches.length - 1];
				
				originX = touch.pageX;
				originY = touch.pageY;
			} else {
				originX = mousedownEvent.pageX;
				originY = mousedownEvent.pageY;
			}
			
			var elements;
				
			if( element.selected() ){
				elements = self.selectedElements.add(element).filter(":grabbable");
			} else {
				elements = element.collection();
			}

			var justStartedDragging = true;
			var dragHandler = function(dragEvent){
				
				draggedAfterMouseDown = true;
				
				var dragX, dragY;
				
				if( dragEvent.type == "touchmove" ){
					var touches = mousedownEvent.originalEvent.touches;
					var touch = touches[touches.length - 1];
					
					dragX = touch.pageX;
					dragY = touch.pageY;
				} else {
					dragX = dragEvent.pageX;
					dragY = dragEvent.pageY;
				}
				
				var dx = (dragX - originX) / self.zoom();
				var dy = (dragY - originY) / self.zoom();
				
				// new origin each event
				originX = dragX;
				originY = dragY;
				
				elements.each(function(i, e){
					e.element()._private.position.x += dx;
					e.element()._private.position.y += dy;
				});			
				
				self.updatePosition( elements );
				
				if( justStartedDragging ){
					
					// TODO we should be able to do this on iOS too
					if( dragEvent.type != "touchmove" ){
						self.moveToFront(element);
					}
					
					justStartedDragging = false;
					
				} else {
					element.trigger($.extend({}, dragEvent, { type: "position" }));
					element.trigger($.extend({}, dragEvent, { type: "drag" }));
				}
				
				
			};
			
			$(window).bind("mousemove touchmove", dragHandler);
			
			var finishedDragging = false;
			var touchEndCount = 0;
			var endHandler = function(mouseupEvent){
				if( mouseupEvent.type == "touchend" && mouseupEvent.originalEvent.touches.length != 0 ){
					return;
				}
				
				if( !finishedDragging ){
					finishedDragging = true;
				} else {
					return;
				}
				
				$(window).unbind("mousemove touchmove", dragHandler);

				$(window).unbind("mouseup touchend blur", endHandler);
				$(svgDomElement).unbind("mouseup touchend", endHandler);
				
				element._private.grabbed = false;
				self.touchingNodes = self.touchingNodes.not(element);
				
				element.trigger($.extend({}, mouseupEvent, { type: "free" }));
			};
			
			$(window).bind("mouseup touchend blur", endHandler);
			$(svgDomElement).bind("mouseup touchend", endHandler);
			
			mousedownEvent.preventDefault();
		}).bind("mouseup touchend", function(e){
			element.trigger($.extend({}, e));
			
			if( draggedAfterMouseDown == false ){
				draggedAfterMouseDown = null;
				element.trigger($.extend({}, e, { type: "click" }));
				self.selectElement(element);
			}
		}).bind("mouseover mouseout mousemove", function(e){
			// ignore events created falsely for recreated elements
			if( self.nodeEventIsValid(element, e) ){
				element.trigger($.extend({}, e));
			}
		});
		
	};
	

	SvgRenderer.prototype.edgeEventIsValid = function(element, event){
		var $rt = $(event.relatedTarget);
		var self = this;
		
		switch( event.type ){
		case "mouseover":
		case "mouseout":
			return $rt.parent().parent().size() > 0; // don't count when elements were removed
		default:
			return true;
		}		
	};
	
	SvgRenderer.prototype.nodeEventIsValid = function(element, event){
		var $rt = $(event.relatedTarget);
		var self = this;

		switch( event.type ){
		case "mouseover":
		case "mouseout":
			return $rt.parent().parent().size() > 0; // don't count when elements were removed
		default:
			return true;
		}		
	};
	
	SvgRenderer.prototype.modelPoint = function(screenPoint){
		var self = this;
		var mpos = {};

		if( screenPoint.x !== undefined ){
			mpos.x = (screenPoint.x - self.pan().x) / self.zoom();
		}
		
		if( screenPoint.y !== undefined ){
			mpos.y = (screenPoint.y - self.pan().y) / self.zoom();
		}
		
		return mpos;
	};
	
	SvgRenderer.prototype.renderedPoint = function(modelPoint){
		var self = this;
		var rpos = {};
		
		if( modelPoint.x !== undefined ){
			rpos.x = modelPoint.x * self.zoom() + self.pan().x;
		}
		
		if( modelPoint.y !== undefined ){
			rpos.y = modelPoint.y * self.zoom() + self.pan().y;
		}
		
		return rpos;
	};
	
	SvgRenderer.prototype.unselectElements = function(collection){
		collection = collection.collection();
		
		collection.unselect();
		this.selectedElements = this.selectedElements.not(collection);
	};
	
	// by drag select
	SvgRenderer.prototype.selectElementsFromIntersection = function(svgSelectionShape, selectionBounds){
		var self = this;
		var toSelect = this.cy.collection();
		var toUnselect = this.cy.collection();
		
		function nodeInside(element){

			if( !element.visible() ){
				return false;
			}
			
			// intersect rectangle in the model with the actual node shape in the model
			var shape = nodeShape( element._private.style["shape"].strValue ).intersectionShape;
			var modelRectangleP1 = self.modelPoint({ x: selectionBounds.x1, y: selectionBounds.y1 });
			var modelRectangleP2 = self.modelPoint({ x: selectionBounds.x2, y: selectionBounds.y2 });
			var modelRectangle = self.svg.rect(modelRectangleP1.x, modelRectangleP1.y, modelRectangleP2.x - modelRectangleP1.x, modelRectangleP2.y - modelRectangleP1.y);
			var intersection = Intersection.intersectShapes(new Rectangle(modelRectangle), new shape( element.rscratch("svg") ));
			self.svgRemove(modelRectangle);
			
			// rendered node
			var zoom = self.zoom();
			var x = element.renderedPosition().x;
			var y = element.renderedPosition().y;
			var w = element.renderedOuterWidth();
			var h = element.renderedOuterHeight();
			
			// rendered selection square
			var x1 = selectionBounds.x1;
			var y1 = selectionBounds.y1;
			var x2 = selectionBounds.x2;
			var y2 = selectionBounds.y2;
			
			var centerPointInside = x1 <= x && x <= x2 && y1 <= y && y <= y2;
			var intersects = intersection.points.length > 0;
			
			return centerPointInside || intersects;
		}
		
		this.cy.elements().each(function(i, element){
			if( element.isNode() ){
				if( nodeInside(element) ){
					toSelect = toSelect.add(element);
				}
			} else {
				// if both node center points are inside, then the edge is inside
				if( element.visible() &&
					nodeInside( element.source()[0] ) &&
					nodeInside( element.target()[0] ) ){
					
					toSelect = toSelect.add(element);
				}
				
			}
		});
		
		if( !self.shiftDown ){
			toUnselect = toUnselect.add(
				this.cy.elements().filter(function(i, e){
					return e.selected() && !toSelect.same(e);
				})
			);
		}
		
		toUnselect.unselect();
		toSelect.select();
		
		self.selectedElements = self.selectedElements.not(toUnselect);
		self.selectedElements = self.selectedElements.add(toSelect);
		
		// TODO do we need this?
		//self.moveToFront(toSelect.nodes());
		
	};
	
	// by clicking
	SvgRenderer.prototype.selectElement = function(element){
		var self = this;
		
		var toUnselect = self.cy.collection();
		var toSelect = self.cy.collection();
		
		if( !self.shiftDown ){
			toUnselect = toUnselect.add(
				self.cy.elements().filter(function(i, e){
					return e.selected() && !element.same(e);
				})
			);
		}
		
		if( self.shiftDown ){
			if( element.selected() ){
				toUnselect = toUnselect.add(element);
			} else {
				toSelect = toSelect.add(element);
			}
		} else if( !element.selected() ){
			toSelect = toSelect.add(element);
		}
		
		toUnselect.unselect();
		toSelect.select();
		
		self.selectedElements = self.selectedElements.not(toUnselect);
		self.selectedElements = self.selectedElements.add(toSelect);
		self.moveToFront(toSelect);
	};
	
	SvgRenderer.prototype.moveToFront = function(collection){
		collection = collection.collection();
		var self = this;
		
		collection.each(function(i, element){
			self.svgRemove( element.rscratch("svgGroup") );
			self.makeSvgElement(element);
			self.updatePosition( collection.closedNeighborhood().edges() );
		});
	};
	
	SvgRenderer.prototype.unselectAll = function(){
		this.unselectElements(this.cy.elements());
	};
	
	SvgRenderer.prototype.makeSvgNode = function(element){		
		var p = element.position();
		var self = this;
		
		if( p.x == null || p.y == null ){
			
			return;
		}
		
		var svgDomElement;
		var style = element._private.style;
		
		var svgDomGroup = this.svg.group(this.nodesGroup);
		element.rscratch("svgGroup", svgDomGroup);
		
		svgDomElement = nodeShape(style.shape.strValue).svg(this.svg, svgDomGroup, element, p, style);
		element.rscratch().oldShape = style.shape.strValue;
		element.rscratch("svg", svgDomElement);
		this.makeSvgNodeLabel(element);
		
		element.rscratch("svg", svgDomElement);
		
		
		this.makeSvgNodeInteractive(element);
		this.updateElementStyle(element, style);
		return svgDomElement;
	};
	
	SvgRenderer.prototype.makeSvgNodeLabel = function(element){
		var self = this;
		
		var x = element.position("x");
		var y = element.position("y");
		
		element.rscratch().svgLabelGroup = self.svg.group(element.rscratch().svgGroup);
		element.rscratch().svgLabelOutline = self.svg.text(element.rscratch().svgLabelGroup, x, y, "label init");
		element.rscratch().svgLabel = self.svg.text(element.rscratch().svgLabelGroup, x, y, "label init");
	};
	
	SvgRenderer.prototype.positionSvgNodeLabel = function(element){
		var self = this;

		var x = element.position("x");
		var y = element.position("y");
		
		self.svg.change(element.rscratch().svgLabel, {
			x: x,
			y: y
		});
		
		self.svg.change(element.rscratch().svgLabelOutline, {
			x: x,
			y: y
		});
	};
	
	SvgRenderer.prototype.makeSvgEdgePath = function(element){ 
		var self = this;
		var tgt = element.target()[0];
		var src = element.source()[0];
		var loop = tgt.data("id") == src.data("id");
		var svgPath;
		
		var x1 = src.position("x");
		var y1 = src.position("y");
		var x2 = tgt.position("x");
		var y2 = tgt.position("y");
		
		// if the nodes are directly on top of each other, just make a small difference
		// so we don't get bad calculation states (e.g. divide by zero)
		if( x1 == x2 && y1 == y2 ){
			x2++;
			y2++;
		}
		
		var parallelEdges = element.parallelEdges();
		var size = parallelEdges.size();
		var index;
		var curveIndex;
		var curveDistance = 20;
		var betweenLoopsDistance = 20;
		var cp, cp1, cp2;
		var pDistance = self.getDistance({ x: x1, y: y1 }, { x: x2, y: y2 });
		var maxCurveDistance = 200;
		
		if( !loop && curved ){
			curveDistance = Math.min(20 + 4000/pDistance, maxCurveDistance);
		}
	
		parallelEdges.each(function(i, e){
			if( e == element ){
				index = i;
			}
		});
		
		function makePath(){
			var curved = curveIndex != 0;
			var path = self.svg.createPath();
			
			if( svgPath != null ){
				self.svgRemove(svgPath);
			}
			
			if( loop ){
				svgPath = self.svg.path( element.rscratch("svgGroup"), path.move(x1, y1).curveC(cp1.x, cp1.y, cp2.x, cp2.y, x2, y2) );
			} else if( curved ){
				svgPath = self.svg.path( element.rscratch("svgGroup"), path.move(x1, y1).curveQ(cp.x, cp.y, x2, y2) );
			} else {
				svgPath = self.svg.path( element.rscratch("svgGroup"), path.move(x1, y1).line(x2, y2) );
			}
		}
		
		if( loop ){
			var sh = src.height()
			var sw = src.width()
			curveDistance += Math.max(sw, sh);
			
			curveIndex = index;
			curveDistance += betweenLoopsDistance * (curveIndex);
			
			var h = curveDistance;
	        cp1 = { x: x1, y: y1 - sh/2 - h };
	        cp2 = { x: x1 - sw/2 - h, y: y1 };
			
			makePath();
		} else {
			// edge between 2 nodes
			
			var even = size % 2 == 0;
			if( even ){
				// even
				curveIndex = index - size/2 + (index < size/2 ? 0 : 1); // add one if on positive size (skip 0)
				
				if( curveIndex > 0 ){
					curveIndex -= 0.5;
				} else {
					curveIndex += 0.5;
				}
			} else {
				// odd
				curveIndex = index - Math.floor(size/2);
			}
			
			var curved = curveIndex != 0;
			
			if( src.id() > tgt.id() ){
				curveIndex *= -1;
			}
			
			if(curved){
				cp = cp1 = cp2 = self.getOrthogonalPoint({ x: x1, y: y1 }, { x: x2, y: y2 }, curveDistance * curveIndex);
			} else {
				cp = cp1 = {
					x: x2,
					y: y2
				};
				
				cp2 = {
					x: x1,
					y: y1
				};
			}
			
			makePath();
		}
		
		var edgeWidth = element._private.style.width.pxValue;
		var targetShape = tgt._private.style["shape"].value;
		var sourceShape = src._private.style["shape"].value;
		var targetArrowShape = element._private.style["target-arrow-shape"].value;
		var sourceArrowShape = element._private.style["source-arrow-shape"].value;
		var markerFactor = 3;
		var minArrowSize = 10;
		
		while(markerFactor * edgeWidth < minArrowSize){
			markerFactor++;
		}
		
		var f = markerFactor;
		var markerHeight = f * edgeWidth;
		var targetShape = nodeShape(targetShape).intersectionShape;
		var sourceShape = nodeShape(sourceShape).intersectionShape;
		
		var intersection = Intersection.intersectShapes(new Path(svgPath), new targetShape( tgt.rscratch("svg") ));
		var tgtInt = intersection.points[ intersection.points.length - 1 ];
		
		intersection = Intersection.intersectShapes(new Path(svgPath), new sourceShape( src.rscratch("svg") ));
		var srcInt = intersection.points[0];
		
		var scale = f * edgeWidth;
		var sourceRotation = -1*(this.getAngle(cp1, { x: x1, y: y1 }) - 90);
		var targetRotation = -1*(this.getAngle(cp2, { x: x2, y: y2 }) - 90);
		
		if( tgtInt != null ){
			if( targetArrowShape != "none" ){
				var end = self.getPointAlong(tgtInt, cp2, markerHeight/2, tgtInt);
				x2 = end.x;
				y2 = end.y;
			} else if( tgtInt != null ){
				x2 = tgtInt.x;
				y2 = tgtInt.y;
			}
		}
		
		if( srcInt != null ){
			if( sourceArrowShape != "none" ){
				var start = self.getPointAlong(srcInt, cp1, markerHeight/2, srcInt);
				x1 = start.x;
				y1 = start.y;
			} else {
				x1 = srcInt.x;
				y1 = srcInt.y;
			}
		}
		
		makePath();
		
		if( element.rscratch("svgTargetArrow") != null ){
			this.svgRemove( element.rscratch("svgTargetArrow") );
		}
		
		if( targetArrowShape != "none" ){
			var tgtShapeObj = edgeArrowShape(targetArrowShape);
			var tgtArrowTranslation = {
				x: x2 - tgtShapeObj.centerPoint.x * scale,
				y: y2 - tgtShapeObj.centerPoint.y * scale,
			};
			var targetCenter = tgtShapeObj.centerPoint;
			var targetArrow = tgtShapeObj == null ? null : tgtShapeObj.svg( this.svg, element.rscratch("svgGroup"), element, element.position(), element._private.style );
			element.rscratch("svgTargetArrow", targetArrow);

			this.svg.change(targetArrow, {
				transform: "translate(" + tgtArrowTranslation.x + " " + tgtArrowTranslation.y + ") scale(" + scale + ") rotate(" + targetRotation + " " + targetCenter.x + " " + targetCenter.y + ")"
			});
		}
		
		if( element.rscratch("svgSourceArrow") != null ){
			this.svgRemove( element.rscratch("svgSourceArrow") );
		}
		
		if( sourceArrowShape != "none" ){		
			var srcShapeObj = edgeArrowShape(sourceArrowShape);
			var srcArrowTranslation = {
				x: x1 - srcShapeObj.centerPoint.x * scale,
				y: y1 - srcShapeObj.centerPoint.y * scale,
			};
			var sourceCenter = srcShapeObj.centerPoint;
			var sourceArrow = srcShapeObj == null ? null : srcShapeObj.svg(this.svg, element.rscratch("svgGroup"), element, element.position(), element._private.style );
			element.rscratch().svgSourceArrow = sourceArrow;
			
			this.svg.change(sourceArrow, {
				transform: "translate(" + srcArrowTranslation.x + " " + srcArrowTranslation.y + ") scale(" + scale + ") rotate(" + sourceRotation + " " + sourceCenter.x + " " + sourceCenter.y + ")"
			});
		}
		
		var labelPosition;
		if( loop ){
			labelPosition = {
				x: (cp1.x + cp2.x)/2*0.85 + tgt.position("x")*0.15,
				y: (cp1.y + cp2.y)/2*0.85 + tgt.position("y")*0.15
			};
		} else if( curved ) {
			labelPosition = {
				x: ( cp.x + (x1+x2)/2 )/2,
				y: ( cp.y + (y1+y2)/2 )/2
			};
		} else {
			labelPosition = {
				x: (x1 + x2)/2,
				y: (y1 + y2)/2
			};
		}
		
		element.rscratch("svgLabelGroup", self.svg.group(element.rscratch().svgGroup) );
		element.rscratch("svgLabelOutline", self.svg.text(element.rscratch().svgLabelGroup, labelPosition.x, labelPosition.y, "label init") );
		element.rscratch("svgLabel", self.svg.text(element.rscratch().svgLabelGroup, labelPosition.x, labelPosition.y, "label init") );
		
		element.rscratch().svg = svgPath;
		return svgPath;
	};
	
	
	SvgRenderer.prototype.markerDrawFix = function(){
		this.forceRedraw();
	};
	
	window.redraw = SvgRenderer.prototype.forceRedraw = function(){
		this.svg.change(this.svgRoot, {
			opacity: 0
		});
		
		this.svg.change(this.svgRoot, {
			opacity: Math.random()
		});
		
		this.svg.change(this.svgRoot, {
			opacity: 1
		});
		
		var rect = this.svg.rect(0, 0, this.cy.container().width(), this.cy.container().height());
		this.svgRemove(rect);
	};
	
	SvgRenderer.prototype.getAngle = function(p1, p2){
		var rad2deg = function(rad){
			return rad * 180/Math.PI;
		};
		
		var h = this.getDistance(p1, p2);
		var dx = p2.x - p1.x;
		var dy = -1*(p2.y - p1.y);
		var acos = rad2deg( Math.acos( dx/h ) );
		
		if( dy < 0 ){
			return 360 - acos;
		} else {
			return acos;
		}

	};
	
	SvgRenderer.prototype.getOrthogonalPoint = function(p1, p2, h){
		var diff = { x: p1.x-p2.x, y: p1.y-p2.y };
	    var normal = this.getNormalizedPoint({ x: diff.y, y: -diff.x }, 1);
	    
	    var mid = { x: (p1.x + p2.x)/2, y: (p1.y + p2.y)/2 };
	    
	    return {x: mid.x + normal.x * h, y: mid.y + normal.y * h};
	};
	
	SvgRenderer.prototype.getPointAlong = function(p1, p2, h, p0){
		var slope = { x: p2.x-p1.x, y: p2.y-p1.y };
	    var normalSlope = this.getNormalizedPoint({ x: slope.x, y: slope.y }, 1);
	    
	    if( p0 == null ){
	    	p0 = p2;
	    }
	    
	    return {
	    	x: p0.x + normalSlope.x * h,
	    	y: p0.y + normalSlope.y * h
	    };
	};
	
	SvgRenderer.prototype.getNormalizedPoint = function(p, newLength){
		var currentLength = Math.sqrt(p.x*p.x + p.y*p.y);
		var factor = newLength / currentLength;
		
		return {
			x: p.x * factor,
			y: p.y * factor
		};
	};
	
	SvgRenderer.prototype.getDistance = function(p1, p2){
		return Math.sqrt( (p2.x - p1.x)*(p2.x - p1.x) + (p2.y - p1.y)*(p2.y - p1.y) );
	};
	
	SvgRenderer.prototype.makeSvgEdge = function(element){
		var self = this;
		var source = element.source().element();
		var target = element.target().element();
					
		if( source == null || target == null ){
			
			return;
		}
		
		var ps = source.position();
		var pt = target.position();
		
		if( ps.x == null || ps.y == null || pt.x == null || pt.y == null ){
			
			return;
		}
		
		var style = element._private.style;
		
		var svgDomGroup = this.svg.group(this.edgesGroup);
		element.rscratch().svgGroup = svgDomGroup;
		this.svg.change(svgDomGroup);
		
		// notation: (x1, y1, x2, y2) = (source.x, source.y, target.x, target.y)
		this.makeSvgEdgePath(element);
		
		
		this.makeSvgEdgeInteractive(element);
		this.updateElementStyle(element, style);
		return element.rscratch().svg;
	};
	
	SvgRenderer.prototype.makeSvgElement = function(element){
		var svgDomElement;
		
		if( element.group() == "nodes" ){
			svgDomElement = this.makeSvgNode(element);
		} else if( element.group() == "edges" ){
			svgDomElement = this.makeSvgEdge(element);
		}
		
		return svgDomElement;
	};
	
	SvgRenderer.prototype.getSvgElement = function(element){
		if( element.rscratch().svg != null ){
			return element.rscratch().svg;
		} else {
			return this.makeSvgElement(element);
		}
	};
	
	SvgRenderer.prototype.updateSelection = function(collection){
		this.updateElementsStyle(collection);
	};
	
	SvgRenderer.prototype.updateClass = function(collection){
		this.updateElementsStyle(collection);
	};
	
	SvgRenderer.prototype.updateData = function(collection, updateMappers){
		this.updateElementsStyle(collection);
		
		if( updateMappers ){
			this.updateMapperBounds( collection );
		}
	};
	
	SvgRenderer.prototype.updateMapperBounds = function(collection){
		var elements = this.cy.elements();
		
		if( collection.nodes().size() > 0 && collection.edges().size() > 0 ){
			// update both nodes & edges
		} else {
			// update only the group in the collection
			elements = elements.filter(function(){
				return this.group() == collection.eq(0).group();
			});
		}
		
		elements = elements.not(collection);
		this.updateElementsStyle( elements );
	};
	
	SvgRenderer.prototype.updateElementsStyle = function(collection){
		var self = this;
		collection = collection;
		
		// update nodes
		var nodes = collection.nodes();
		for( var i = 0; i < nodes.length; i++ ){
			var node = nodes[i];
			self.updateElementStyle(node);
		}

		var edges = collection.edges();
		for( var i = 0; i < edges.length; i++ ){
			var edge = edges[i];

			self.updateElementStyle(edge);
		}
		
		var connectedEdges = collection.connectedEdges().not(edges);
		for( var i = 0; i < connectedEdges.length; i++ ){
			var edge = connectedEdges[i];
			self.updateElementStyle(edge);
		}
	};
	
	SvgRenderer.prototype.setStyle = function(style){
		this.style = $.extend(true, {}, defaults.style, style);
	};
	
	SvgRenderer.prototype.updateStyle = function(eles){
		this.updateElementsStyle(eles);
	};
	
	SvgRenderer.prototype.updateBypass = function(collection){
		var self = this;
		collection = collection.collection();
		
		// update nodes
		collection.nodes().each(function(i, element){
			self.updateElementStyle(element);
		});
		
		// update connected edges
		collection.edges().add( collection.closedNeighborhood().edges() ).each(function(i, edge){
			self.updateElementStyle(edge);
		});
	};
	
	SvgRenderer.prototype.updateElementStyle = function(element, newStyle){ 
		if( element.isNode() ){
			this.updateNodeStyle(element, newStyle);
		} else if( element.isEdge() ){
			this.updateEdgeStyle(element, newStyle);
		}
	};
	
	SvgRenderer.prototype.updateNodeStyle = function(element, newStyle){
		
		
		var style = element._private.style;
		
		var newShape = element._private.style.shape.strValue;
		var oldShape = element.rscratch().oldShape;
		
		if( element.rscratch().svg == null ){
			//$.error("SVG renderer can not update style for node `%s` since it has no SVG element", element.id());
			return;
		}
		
		if( oldShape != undefined && newShape != oldShape ){
			this.svgRemove(element.rscratch().svgGroup);
			this.makeSvgNode(element);
			return;
		}
			
		var visible = element.visible();

		// TODO add more as more styles are added
		// generic styles go here
		this.svg.change(element.rscratch().svg, {
			"pointer-events": "visible", // if visibility:hidden, no events
			fill: style["background-color"].strValue,
			fillOpacity: style["background-opacity"].strValue,
			stroke: style["border-width"].value > 0 ? style["border-color"].strValue : "none",
			strokeWidth: style["border-width"].value,
			strokeDashArray: lineStyle( style["border-style"].strValue ).array,
			strokeOpacity: style["border-opacity"].value,
			cursor: style["cursor"].strValue,
			"visibility": visible ? "visible" : "hidden",
		});
		
		this.svg.change(element.rscratch().svgGroup, {
			opacity: style["opacity"].value
		});
		
		// styles for label		
		var labelOptions = {
			"visibility": visible ? "visible" : "hidden",
			"pointer-events": "none",
			fill: style["color"].strValue,
			"font-family": style["font-family"].strValue,
			"font-weight": style["font-weight"].strValue,
			"font-style": style["font-style"].strValue,
			"text-decoration": style["text-decoration"].strValue,
			"font-variant": style["font-variant"].strValue,
			"font-size": style["font-size"].strValue,
			"text-rendering": "geometricPrecision"
		};
		
		this.svg.change(element.rscratch().svgLabelGroup, {
			opacity: style["text-opacity"].value
		});
		
		this.svg.change(element.rscratch().svgLabelOutline, {
			stroke: style["text-outline-color"].strValue,
			strokeWidth: style["text-outline-width"].value * 2,
			fill: "none",
			opacity: style["text-opacity"].value
		});
		
		this.svg.change(element.rscratch().svgLabelOutline, labelOptions);
		this.svg.change(element.rscratch().svgLabel, labelOptions);
		
		var labelText = style["content"] ? style["content"].value : "";
		element.rscratch().svgLabel.textContent = labelText;
		element.rscratch().svgLabelOutline.textContent = labelText;
		
		var valign = style["text-valign"].strValue;
		var halign = style["text-halign"].strValue;
		
		// styles to the group
		this.svg.change(element.rscratch().svgGroup, {
			fillOpacity: style["opacity"].value
		});
		
		// update shape specific stuff like position
		nodeShape(style.shape.strValue).update(this.svg, this.nodesGroup, element, element.position(), style);
		
		// update label position after the node itself
		this.updateLabelPosition(element, valign, halign);	
		
	};
	
	SvgRenderer.prototype.updateLabelPosition = function(element, valign, halign){
		var spacing = 3;
		var dx = 0;
		var dy = 0;
		var height = 0;
		var width = 0;
		var text = element.rscratch().svgLabel.textContent;
		
		// update node label x, y
		if( element.isNode() ){
			this.positionSvgNodeLabel(element);
		}
		
		var textAnchor;
		var styleAttr;
		var transform;
		
		if( text == null || text == "" ){
			return;
		}
		
		if( element.isNode() ){
			height = element.height();
			width = element.width();
		}
		
		if( halign == "center" ){
			textAnchor =  {
				"text-anchor": "middle"
			};
		} else if( halign == "right" ){
			textAnchor =  {
				"text-anchor": "start"
			};
			dx = width/2 + spacing;
		} else if( halign == "left" ){
			textAnchor =  {
				"text-anchor": "end"
			};
			dx = -width/2 - spacing;
		}
		
		// TODO remove this hack to fix IE when it supports baseline properties properly
		var fontSize = parseInt(window.getComputedStyle(element.rscratch().svgLabel)["fontSize"]);
		var ieFix = $.browser.msie ? fontSize/3 : 0;
	
		if( valign == "center" ){
			styleAttr = {
				"style": "alignment-baseline: central; dominant-baseline: central;"
			};
			dy = 0 + ieFix;
		} else if( valign == "top" ){
			styleAttr = {
				"style": "alignment-baseline: normal; dominant-baseline: normal;"	
			};
			dy = -height/2 - spacing;
		} else if( valign == "bottom" ){
			styleAttr = {
				"style": "alignment-baseline: normal; dominant-baseline: normal;"
			};
			dy = height/2 + fontSize;
		}
		
		transform = {
			transform: "translate("+ dx +","+ dy +")"
		};
		
		var labelOptions = $.extend({}, textAnchor, styleAttr, transform);
		
		this.svg.change(element.rscratch().svgLabelOutline, labelOptions);
		this.svg.change(element.rscratch().svgLabel, labelOptions);
	};
	
	SvgRenderer.prototype.updateEdgeStyle = function(element, newStyle){
		var rs = element.rscratch();		
		var style = element._private.style;
		
		if( element.rscratch().svg == null || element.removed() ){
			return;
		}
		
		var src = element.source()[0];
		var tgt = element.target()[0];

		var oldTargetArrowShape = rs.targetArrowShape;
		var oldSourceArrowShape = rs.sourceArrowShape;
		var newTargetArrowShape = style["target-arrow-shape"].value;
		var newSourceArrowShape = style["source-arrow-shape"].value;
		rs.targetArrowShape = newTargetArrowShape;
		rs.sourceArrowShape = newSourceArrowShape;
		var arrowShapesDifferent = 
			oldTargetArrowShape !== newTargetArrowShape ||
			oldSourceArrowShape !== newSourceArrowShape
		;

		var oldSrcHeight = rs.srcHeight;
		var oldTgtHeight = rs.tgtHeight;
		var newSrcHeight = src.outerHeight();
		var newTgtHeight = tgt.outerHeight();
		rs.srcHeight = newSrcHeight;
		rs.tgtHeight = newTgtHeight;
		var heightDifferent = 
			oldSrcHeight !== newSrcHeight ||
			oldTgtHeight !== newTgtHeight
		;

		var oldSrcWidth = rs.srcWidth;
		var oldTgtWidth = rs.tgtWidth;
		var newSrcWidth = src.outerWidth();
		var newTgtWidth = tgt.outerWidth();
		rs.srcWidth = newSrcWidth;
		rs.tgtWidth = newTgtWidth;
		var widthDifferent = 
			oldSrcWidth !== newSrcWidth ||
			oldTgtWidth !== newTgtWidth
		;

		var oldTargetNodeShape = rs.targetNodeShape;
		var oldSourceNodeShape = rs.sourceNodeShape;
		var newTargetNodeShape = tgt._private.style.shape.value;
		var newSourceNodeShape = src._private.style.shape.value;
		rs.targetNodeShape = newTargetNodeShape;
		rs.sourceNodeShape = newSourceNodeShape;
		var shapeDifferent =
			oldTargetNodeShape !== newTargetNodeShape ||
			oldSourceNodeShape !== newSourceNodeShape
		;

		
		var styleChanged = 
			arrowShapesDifferent ||
			heightDifferent ||
			widthDifferent ||
			shapeDifferent
		;
		
		if( styleChanged ){
			this.svgRemove(element.rscratch().svgGroup);
			this.makeSvgEdge(element);
			
			return;
		}
		
		var visible = element.visible();

		// TODO add more as more styles are added
		// generic edge styles go here
		this.svg.change(element.rscratch().svg, {
			"pointer-events": "visibleStroke", // on visibility:hidden, no events
			stroke: style["line-color"].strValue,
			strokeWidth: style["width"].pxValue,
			strokeDashArray: style["line-style"].strValue,
			"stroke-linecap": "butt", // disable for now for markers to line up nicely
			cursor: style["cursor"].value,
			fill: "none",
			visibility: visible ? "visible" : "hidden"
		});
		
		this.svg.change(element.rscratch().svgGroup, {
			opacity: style["opacity"].value
		});
		
		this.svg.change(element.rscratch().svgTargetArrow, {
			fill: style["target-arrow-color"].strValue,
			cursor: style["cursor"].value,
			visibility: visible ? "visible" : "hidden"
		});
		
		this.svg.change(element.rscratch().svgSourceArrow, {
			fill: style["source-arrow-color"].strValue,
			cursor: style["cursor"].value,
			visibility: visible ? "visible" : "hidden"
		});
		
		var labelOptions = {
			"visibility": visible ? "visible" : "hidden",
			"pointer-events": "none",
			fill: style["color"].strValue,
			"font-family": style["font-family"].strValue,
			"font-weight": style["font-weight"].strValue,
			"font-style": style["font-style"].strValue,
			"text-decoration": style["text-decoration"].strValue,
			"font-variant": style["font-variant"].strValue,
			"font-size": style["font-size"].pxValue,
			"text-rendering": "geometricPrecision"
		};
		
		this.svg.change(element.rscratch().svgLabel, labelOptions);
		this.svg.change(element.rscratch().svgLabelOutline, $.extend({}, labelOptions, {
			fill: "none",
			stroke: style["text-outline-color"].strValue,
			strokeWidth: style["text-outline-width"].pxValue * 2,
			opacity: style["text-outline-opacity"].value
		}) );
		
		this.svg.change(element.rscratch().svgLabelGroup, {
			opacity: style["text-opacity"].value
		});
		
		var labelText = style["content"];
		if( !labelText || !labelText.value ){
			labelText = "";
		} else {
			labelText = labelText.value;
		}

		element.rscratch().svgLabel.textContent = labelText;
		element.rscratch().svgLabelOutline.textContent = labelText;
		this.updateLabelPosition(element, "center", "center");
		
		
	};
	
	SvgRenderer.prototype.addElements = function(collection, updateMappers){
		
		var self = this;
		var cy = this.cy;
		
		collection.nodes().each(function(i, element){
			self.makeSvgElement(element);
		});
		
		collection.edges().each(function(i, element){
			self.makeSvgElement(element);
		});
		
		self.positionEdges( collection.edges().parallelEdges() );

		if( updateMappers ){
			self.updateMapperBounds( collection );
		}
	};
	
	SvgRenderer.prototype.updatePosition = function(collection){
		
		
		
		collection = collection.collection();
		var container = this.cy.container();
		var svg = container.svg('get');
		var self = this;
		var cy = this.options.cy;
		
		// update nodes
		collection.nodes().each(function(i, element){
			var svgEle = self.getSvgElement(element);			
			var p = element.position();
			
			self.updateNodePositionFromShape(element);
			self.positionSvgNodeLabel(element);

			
		});
		
		// update connected edges
		self.positionEdges( collection.closedNeighborhood().edges() );
		
	};
	
	SvgRenderer.prototype.positionEdges = function(edges){
		var self = this;
		
		edges.filter(':inside').each(function(i, edge){
			if( edge.rscratch().svgGroup != null ){
				self.svgRemove(edge.rscratch().svgGroup);
			}
			self.makeSvgEdge(edge);
			
			var ps = edge.source().position();
			var pt = edge.target().position();
			
			
		});
	};
	
	SvgRenderer.prototype.drawElements = function(collection){
		var self = this;
		
		self.updateElementsStyle( collection );
	};
	
	SvgRenderer.prototype.removeElements = function(collection, updateMappers){
		
		
		var container = this.cy.container();
		var svg = container.svg('get');
		var cy = this.options.cy;
		var self = this;
		
		collection.each(function(i, element){
			
			if( element.rscratch().svgGroup != null ){
				// remove the svg element from the dom
				self.svgRemove( element.rscratch().svgGroup );
				
				element.rscratch({});
			} else {
				
			}
		});
		
		if( self.selectedElements != null ){
			self.selectedElements = self.selectedElements.not(collection);
		}

		var edgesToReposition = self.cy.collection();
		collection.edges().each(function(i, edge){
			var src = edge.source();
			var tgt = edge.target();

			edgesToReposition = edgesToReposition.add( src.edgesWith( tgt ) );
		});

		edgesToReposition = edgesToReposition.not( collection.edges() );

		self.updatePosition( edgesToReposition );
		
		// if( updateMappers ){
		// 	this.updateMapperBounds( collection );
		// }
	};
	
	SvgRenderer.prototype.notify = function(params){
		var container = this.options.cy.container();
	
		
		
		if( params.type == null ){
			//$.error("The SVG renderer should be notified with a `type` field");
			return;
		}
		
		var self = this;
		switch( params.type ){
			case "load":
				self.init(function(){
					self.addElements( params.collection );
				});
				break;
		
			case "add":
				this.addElements( params.collection, params.updateMappers );
				break;
			
			case "remove":
				this.removeElements( params.collection, params.updateMappers );
				break;
			
			case "position":
				this.updatePosition( params.collection );
				break;
			
			case "style":
				this.updateStyle( params.collection );
				break;

			case "viewport":
				this.updateViewport();
				break;
				
			default:
				
				break;
		}
	};

	function SvgExporter(options){
		this.options = options;
		this.cy = options.cy;
		this.renderer = options.renderer;
		
		if( this.renderer.name() != "svg" ){
			//$.error("The SVG exporter can be used only if the SVG renderer is used");
		}
	}
	
	SvgExporter.prototype.run = function(){
		return this.options.cy.container().svg("get").toSVG();
	};
	
	$.cytoscape("renderer", "svg", SvgRenderer);
	$.cytoscape("exporter", "svg", SvgExporter);
	
})( jQuery, jQuery.cytoscape );

;(function($, $$){
		
	var defaults = {};

	function NullLayout( options ){
		this.options = $.extend(true, {}, defaults, options); 
	}
	
	// puts all nodes at (0, 0)
	NullLayout.prototype.run = function(){
		var options = this.options;
		var cy = options.cy;
		
		cy.nodes().positions(function(){
			return {
				x: 0,
				y: 0
			};
		});
		
		cy.one("layoutready", options.ready);
		cy.trigger("layoutready");
		
		cy.one("layoutstop", options.stop);
		cy.trigger("layoutstop");
	};

	NullLayout.prototype.stop = function(){
		// not a continuous layout
	};
	
	$$("layout", "null", NullLayout);
	
})(jQuery, jQuery.cytoscape);

;(function($, $$){
	
	var defaults = {
		ready: undefined, // callback on layoutready
		stop: undefined, // callback on layoutstop
		fit: true // whether to fit to viewport
	};
	
	function RandomLayout( options ){
		this.options = $.extend(true, {}, defaults, options);
	}
	
	RandomLayout.prototype.run = function(){
		var options = this.options;
		var cy = options.cy;
		var nodes = cy.nodes();
		var edges = cy.edges();
		var $container = cy.container(); // the container div for cytoscapeweb
		
		var width = $container.width();
		var height = $container.height();
		

		nodes.positions(function(i, element){
			
			if( element.locked() ){
				return false;
			}

			return {
				x: Math.round( Math.random() * width ),
				y: Math.round( Math.random() * height )
			};
		});
		
		// layoutready should be triggered when the layout has set each node's
		// position at least once
		cy.one("layoutready", options.ready);
		cy.trigger("layoutready");
		
		if( options.fit ){
			cy.fit();
		}
		
		// layoutstop should be triggered when the layout stops running
		cy.one("layoutstop", options.stop);
		cy.trigger("layoutstop");
	};
	
	RandomLayout.prototype.stop = function(){
		// stop the layout if it were running continuously
	};

	// register the layout
	$$(
		"layout", // we're registering a layout
		"random", // the layout name
		RandomLayout // the layout prototype
	);
	
})(jQuery, jQuery.cytoscape);

;(function($, $$){
	
	var defaults = {
		fit: true,
		rows: undefined,
		columns: undefined
	};
	
	function GridLayout( options ){
		this.options = $.extend({}, defaults, options);
	}
	
	GridLayout.prototype.run = function(){
		var params = options = this.options;
		
		var cy = params.cy;
		var nodes = cy.nodes();
		var edges = cy.edges();
		var $container = cy.container();
		
		var width = $container.width();
		var height = $container.height();

		if( height == 0 || width == 0){
			nodes.positions(function(){
				return { x: 0, y: 0 };
			});
			
		} else {
			
			// width/height * splits^2 = cells where splits is number of times to split width
			var cells = nodes.size();
			var splits = Math.sqrt( cells * height/width );
			var rows = Math.round( splits );
			var cols = Math.round( width/height * splits );

			function small(val){
				if( val == undefined ){
					return Math.min(rows, cols);
				} else {
					var min = Math.min(rows, cols);
					if( min == rows ){
						rows = val;
					} else {
						cols = val;
					}
				}
			}
			
			function large(val){
				if( val == undefined ){
					return Math.max(rows, cols);
				} else {
					var max = Math.max(rows, cols);
					if( max == rows ){
						rows = val;
					} else {
						cols = val;
					}
				}
			}
			
			// if rows or columns were set in options, use those values
			if( options.rows != null && options.columns != null ){
				rows = options.rows;
				cols = options.columns;
			} else if( options.rows != null && options.columns == null ){
				rows = options.rows;
				cols = Math.ceil( cells / rows );
			} else if( options.rows == null && options.columns != null ){
				cols = options.columns;
				rows = Math.ceil( cells / cols );
			}
			
			// otherwise use the automatic values and adjust accordingly
			
			// if rounding was up, see if we can reduce rows or columns
			else if( cols * rows > cells ){
				var sm = small();
				var lg = large();
				
				// reducing the small side takes away the most cells, so try it first
				if( (sm - 1) * lg >= cells ){
					small(sm - 1);
				} else if( (lg - 1) * sm >= cells ){
					large(lg - 1);
				} 
			} else {
				
				// if rounding was too low, add rows or columns
				while( cols * rows < cells ){
					var sm = small();
					var lg = large();
					
					// try to add to larger side first (adds less in multiplication)
					if( (lg + 1) * sm >= cells ){
						large(lg + 1);
					} else {
						small(sm + 1);
					}
				}
			}
			
			var cellWidth = width / cols;
			var cellHeight = height / rows;
			
			var row = 0;
			var col = 0;
			nodes.positions(function(i, element){
				
				if( element.locked() ){
					return false;
				}
				
				var x = col * cellWidth + cellWidth/2;
				var y = row * cellHeight + cellHeight/2;
				
				col++;
				if( col >= cols ){
					col = 0;
					row++;
				}
				
				return { x: x, y: y };
				
			});
		}
		
		if( params.fit ){
			cy.reset();
		} 
		
		cy.one("layoutready", params.ready);
		cy.trigger("layoutready");
		
		cy.one("layoutstop", params.stop);
		cy.trigger("layoutstop");
	};

	GridLayout.prototype.stop = function(){
		// not a continuous layout
	};
	
	$$("layout", "grid", GridLayout);
	
})(jQuery, jQuery.cytoscape);

;(function($, $$){
	
	var defaults = {
		fit: true
	};
	
	function PresetLayout( options ){
		this.options = $.extend(true, {}, defaults, options);
	}
	
	PresetLayout.prototype.run = function(){
		var options = this.options;
		var cy = options.cy;
		var nodes = cy.nodes();
		var edges = cy.edges();
		var container = cy.container();
		
		function getPosition(node){
			if( options.positions == null ){
				return null;
			}
			
			if( options.positions[node._private.data.id] == null ){
				return null;
			}
			
			return options.positions[node._private.data.id];
		}
		
		nodes.positions(function(i, node){
			var position = getPosition(node);
			
			if( node.locked() || position == null ){
				return false;
			}
			
			return position;
		});
		
		if( options.pan != null ){
			cy.pan( options.pan );
			cy.zoom( options.zoom );
		}

		cy.one("layoutready", options.ready);
		cy.trigger("layoutready");
		
		if( options.fit ){
			cy.fit();
		}
		
		cy.one("layoutstop", options.stop);
		cy.trigger("layoutstop");
	};
	
	$$("layout", "preset", PresetLayout);
	
	$$("core", "presetLayout", function(){
		var cy = this;
		var layout = {};
		var elements = {};
		
		cy.nodes().each(function(i, ele){
			elements[ ele.data("id") ] = ele.position();
		});
		
		layout.positions = elements;
		layout.name = "preset";
		layout.zoom = cy.zoom();
		layout.pan = cy.pan();

		return layout;
	});
	
})(jQuery, jQuery.cytoscape);

/**
 * jQuery Colour 0.6
 *
 * Copyright (c) 2009 Adaptavist.com
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 *
 * Author: Mark Gibson (jollytoad at gmail dot com)
 *
 * http://www.adaptavist.com/display/jQuery/Colour+Library
 */
(jQuery.color || (function($) {

$.color = {

	// Compare two colour tuples (must be of the same colour space)
	isEqual: function ( tupleA, tupleB ) {
		if ( tupleA.length !== tupleB.length ) { return false; }
		
		var i = tupleA.length;
		while (i--) {
			if ( tupleA[i] !== tupleB[i] ) { return false; }
		}
		
		return true;
	},
	
	// Fix the values in a colour tuple
	fix: function ( tuple, format ) {
		var i = format.length;
		while (i--) {
			if ( typeof tuple[i] === 'number' ) {
				switch(format.charAt(i)) {
					case 'i': // integer
						tuple[i] = Math.round(tuple[i]);
						break;
					case 'o': // octet; integer 0..255
						tuple[i] = Math.min(255, Math.max(0, Math.round(tuple[i])));
						break;
					case '1': // one: float, 0..1
						tuple[i] = Math.min(1, Math.max(0, tuple[i]));
						break;
				}
			}
		}
		return tuple;
	},
	
	self: function( tuple ) {
		return tuple;
	},
	
	// Common alpha channel retrieval, defaults to 1
	alpha: function( val ) {
		return val === undefined ? 1 : val;
	},
	
	// A collection of colour palettes
	palette: {},
	
	// Registered colour functions
	fns: []
};

})(jQuery)
);

/*
 * jQuery UI Colour Red-Green-Blue 0.6
 *
 * Copyright (c) 2009 Adaptavist.com
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 *
 * Depends:
 *	color.core.js
 */
(jQuery.color && (function($) {

$.color.RGB = {

	fix: function ( rgb ) {
		rgb = $.color.fix(rgb, 'ooo1');
		return rgb;
	},
	
	toRGB: $.color.self,

	// RGB values must be integers in the range 0-255
	toHEX: function ( rgb ) {
		return '#' + (0x1000000 + rgb[0]*0x10000 + rgb[1]*0x100 + rgb[2]).toString(16).slice(-6);
	},

	toCSS: function ( rgb ) {
		if ( $.color.alpha(rgb[3]) === 0 ) {
			// Completely transparent, use the universally supported name
			return 'transparent';
		}
		if ( $.color.alpha(rgb[3]) < 1 ) {
			// Color is not opaque - according to the CSS3 working draft we should
			// not simply treat an RGBA value as an RGB value with opacity ignored.
			return 'rgba(' + rgb.join(',') + ')';
		}
		return 'rgb(' + Array.prototype.slice.call(rgb,0,3).join(',') + ')';
	},
	
	red: function ( rgb ) {
		return rgb[0];
	},
	
	green: function ( rgb ) {
		return rgb[1];
	},
	
	blue: function ( rgb ) {
		return rgb[2];
	},
	
	alpha: function ( rgb ) {
		return $.color.alpha(rgb[3]);
	}
};

$.color.RGB.toString = $.color.RGB.toHEX;

// Register the colour space methods
$.color.fns.push(
	'RGB.toRGB', 'RGB.toHEX', 'RGB.toCSS',
	'RGB.red', 'RGB.green', 'RGB.blue', 'RGB.alpha'
);

})(jQuery)
);

/*
 * jQuery Colour - Common functions for HSV & HSL colour spaces 0.6
 *
 * Copyright (c) 2009 Adaptavist.com
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 *
 * Depends:
 *	color.core.js
 *  color.rgb.js
 */
(jQuery.color && (function($) {

$.color.HueBased = {

	fix: function ( hx ) {
		hx[0] = (hx[0] + 1) % 1;
		return $.color.fix(hx, '1111');
	},

	complementary: function ( hx, offset ) {
		return [ (hx[0] + 0.5 + (offset || 0)) % 1.0, hx[1], hx[2], hx[3] ];
	},

	analogous: function ( hx, offset ) {
		return [ (hx[0] + 1.0 + (offset || 0)) % 1.0, hx[1], hx[2], hx[3] ];
	},

	hue: function ( hx ) {
		return hx[0];
	},

	alpha: function ( hx ) {
		return $.color.alpha(hx[3]);
	}
};

})(jQuery)
);

/*
 * jQuery Colour Hue-Saturation-Value 0.6
 *
 * Copyright (c) 2009 Adaptavist.com
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 *
 * Depends:
 *	color.core.js
 *  color.rgb.js
 *  color.huebased.js
 */
(jQuery.color && (function($) {

$.color.HSV = $.extend({

	toHSV: $.color.self,

	// HSV values are normalized to the range 0..1
	toRGB: function ( hsv ) {
		var ha = hsv[0]*6,
			hb = Math.floor( ha ),
			f = ha - hb,
			s = hsv[1],
			v = hsv[2] * 255,
			a = hsv[3],
			p = Math.round(v * ( 1 - s )),
			q = Math.round(v * ( 1 - f * s)),
			t = Math.round(v * ( 1 - ( 1 - f ) * s ));
		v = Math.round(v);
		switch (hb % 6) {
			case 0: return [v,t,p,a];
			case 1: return [q,v,p,a];
			case 2: return [p,v,t,a];
			case 3: return [p,q,v,a];
			case 4: return [t,p,v,a];
			case 5: return [v,p,q,a];
		}
	},

	// NOTE: the 'V' this is to distingush HSV from HSL which has a differing view of saturation
	saturationV: function ( hsv ) {
		return hsv[1];
	},

	value: function ( hsv ) {
		return hsv[2];
	}

}, $.color.HueBased);

$.color.RGB.toHSV = function ( rgb ) {
	var r = rgb[0]/255,
		g = rgb[1]/255,
		b = rgb[2]/255,
		min = Math.min(r,g,b),
		max = Math.max(r,g,b),
		d = max - min;

	return [
		d === 0 ? 0 :
		(g === max ? (b-r)/d/6 + (1/3) :
		 b === max ? (r-g)/d/6 + (2/3) :
		         (g-b)/d/6 + 1) % 1,
		d === 0 ? 0 : d/max,
		max,
		rgb[3]
	];
};

// Register the colour space methods
$.color.fns.push(
	'HSV.toHSV', 'HSV.toRGB', 'RGB.toHSV',
	'HSV.complementary', 'HSV.analogous',
	'HSV.hue', 'HSV.saturationV', 'HSV.value', 'HSV.alpha'
);

})(jQuery)
);

/*
 * jQuery Colour Hue-Saturation-Lightness 0.6
 *
 * Copyright (c) 2009 Adaptavist.com
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 *
 * Depends:
 *	color.core.js
 *  color.rgb.js
 *  color.huebased.js
 */
(jQuery.color && (function($) {

$.color.HSL = $.extend({

	toHSL: $.color.self,

	toRGB: function ( hsl ) {
		var h = hsl[0],
			s = hsl[1],
			l = hsl[2],
			q = l < 0.5 ? l*(1+s) : l+s-(l*s),
			p = 2*l-q;

		function c(x) {
			var t = x < 0 ? x+1 : x > 1 ? x-1 : x;
			return t < 1/6 ? p + (q-p) * 6 * t :
			       t < 1/2 ? q :
			       t < 2/3 ? p + (q-p) * 6 * (2/3 - t) :
			                 p;
		}

		return [
			Math.round(255 * c(h + 1/3)),
			Math.round(255 * c(h)),
			Math.round(255 * c(h - 1/3)),
			hsl[3]
		];
	},

	// NOTE: the 'L' this is to distingush HSL from HSV which has a differing view of saturation
	saturationL: function ( hsl ) {
		return hsl[1];
	},

	lightness: function ( hsl ) {
		return hsl[2];
	}

}, $.color.HueBased);

$.color.RGB.toHSL = function ( rgb ) {
	var r = rgb[0]/255,
		g = rgb[1]/255,
		b = rgb[2]/255,
		min = Math.min(r,g,b),
		max = Math.max(r,g,b),
		d = max - min,
		p = max + min;

	return [
		d === 0 ? 0 :
		(g === max ? (b-r)/d/6 + (1/3) :
		 b === max ? (r-g)/d/6 + (2/3) :
		             (g-b)/d/6 + 1) % 1,

		d === 0 ? 0 :
		p > 1 ? d / (2 - max - min) :
		        d / p,

		p/2,
		rgb[3]
	];
};

$.color.fns.push(
	'HSL.toHSL', 'HSL.toRGB', 'RGB.toHSL',
	'HSL.complementary', 'HSL.analogous',
	'HSL.hue', 'HSL.saturationL', 'HSL.lightness', 'HSL.alpha'
);

})(jQuery)
);

/*
 * jQuery Colour Object 0.6
 *
 * Copyright (c) 2009 Adaptavist.com
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 *
 * Depends:
 *  color.core.js
 *  color.rgb.js
 */
(jQuery.color && jQuery.Color || (function($) {

// Construct a colour object of a given space (eg. 'RGB', 'HSV')
$.Color = function ( color, space, name ) {
	if ( typeof this === 'function' ) {
		return new $.Color(color, space, name);
	}
	
	if ( typeof color === 'string' && $.color.parse ) {
		if (!name) {
			name = color;
		}
		// Attempt to parse the string if the parser is available
		color = $.color.parse(color);
	}
	
	if ( color && color.length ) {
		// Copy channel values
		var i;
		i = this.length = color.length;
		while( i-- ) {
			this[i] = color[i];
		}
	}
	
	if ( color ) {
		this.space = space || color.space || 'RGB';
		this.name = name || color.name;
	}
};

function modify( tuple, relative ) {
	// Ensure the color to be modified is the same space as the argument
	var color = $.Color.isInstance(tuple) && tuple.space !== this.space ?
				this.to(tuple.space) :
				new $.Color(this),
		i = color.length,
		mod = false;
	
	while( i-- ) {
		if ( typeof tuple[i] === 'number' ) {
			var v = relative ? color[i] + tuple[i] : tuple[i];
			if ( v !== color[i] ) {
				color[i] = v;
				mod = true;
			}
		}
	}
	
	return mod ? color.setName() : this;
}

$.Color.fn = $.Color.prototype = {

	color: "0.6",
	
	// Get the utility functions for the colour space
	util: function() {
		return $.color[this.space];
	},
	
	// Convert the colour to a different colour space
	to: function( space ) {
		return this['to'+space]();
	},

	// Ensure colour channels values are within the valid limits
	fix: function() {
		return this.util().fix(this);
	},
	
	// Modify the individual colour channels, returning a new color object
	modify: function( tuple ) {
		return modify.call(this, tuple);
	},
	
	// Adjust the colour channels relative to current values
	adjust: function( tuple ) {
		return modify.call(this, tuple, true);
	},
	
	setName: function( newName ) {
		this.name = newName;
		return this;
	},

	toString: function() {
		if ( !this.space ) { return ''; }
		var util = this.util();
		return util.hasOwnProperty('toString') ? util.toString(this) : this.to('RGB').toString();
	},
	
	join: [].join,
	push: [].push
};

// Check whether the given argument is a valid color object
$.Color.isInstance = function( color ) {
	return color && typeof color === 'object' && color.color === $.Color.fn.color && color.space;
};

// Hold the default colour space for each method
$.Color.fnspace = {};

// Generate the wrapper for colour methods calls
function wrapper( color, subject, fn, space, copyName ) {
	return function() {
		var args = [color];
		Array.prototype.push.apply(args, arguments);
		var result = fn.apply(subject, args);
		return $.isArray(result) ? new $.Color(result, space, copyName ? color.name : undefined) : result;
	};
}

// Generate the prototype for method calls
function method( color, name ) {
	var toSpace = /^to/.test(name) ? name.substring(2) : false;
	
	return function() {
		var color = this,
			util = color.util();
		
		if ( !util[name] ) {
			// Convert to the appropriate colour space
			color = color.to($.Color.fnspace[name]);
			util = color.util();
		}
		
		var fn = wrapper(color, util, util[name], toSpace || color.space, !!toSpace),
			result = fn.apply(color, arguments);
		
		// Override the function for this instance so it can be reused
		// without the overhead of another lookup or conversion.
		if ( toSpace ) {
			// The function will return the same result every time, so cache the result
			this[name] = function() {
				return result;
			};
			if ( $.Color.isInstance(result) ) {
				color = this;
				result['to'+this.space] = function() {
					return color;
				};
			}
		} else {
			this[name] = fn;
		}
		
		return result;
	};
}

// Add colour function to the prototype
function addfn() {
	var s = this.split('.'),
		name = s[1],
		space = s[0];
	
	// Ensure the colour space conversion function isn't associated with it's own space
	if ( !$.Color.fnspace[name] && name !== 'to'+space ) {
		$.Color.fnspace[name] = space;
	}
	
	if ( !$.Color.fn[name] ) {
		$.Color.fn[name] = method(this, name);
	}
}

// Add existing functions
$.each($.color.fns, addfn);

// Override push to catch new functions
$.color.fns.push = function() {
	$.each(arguments, addfn);
	return Array.prototype.push.apply(this, arguments);
};

})(jQuery)
);

/*
 * jQuery Colour Parsing 0.6
 *
 * Copyright (c) 2009 Adaptavist.com
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 *
 * Depends:
 *  color.core.js
 */
(jQuery.color && (function($) {

$.extend($.color, {

	// Color string parsing taken from effects.core.js
	parse: function ( color ) {
		var m;

		if ( typeof color === 'string' ) {

			// Look for rgb(int,int,int) or rgba(int,int,int,float)
			if ( (m = /^\s*rgb(a)?\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*(?:,\s*([0-9]+(?:\.[0-9]+)?)\s*)?\)\s*$/.exec(color)) && !m[1] === !m[5] ) {
				return [parseInt(m[2],10), parseInt(m[3],10), parseInt(m[4],10), m[5] ? parseFloat(m[5]) : 1];
			}

			// Look for rgb(float%,float%,float%) or rgba(float%,float%,float%,float)
			if ( (m = /^\s*rgb(a)?\(\s*([0-9]+(?:\.[0-9]+)?)\%\s*,\s*([0-9]+(?:\.[0-9]+)?)\%\s*,\s*([0-9]+(?:\.[0-9]+)?)\%\s*(?:,\s*([0-9]+(?:\.[0-9]+)?)\s*)?\)\s*$/.exec(color)) && !m[1] === !m[5] ) {
				return [parseFloat(m[2])*255/100, parseFloat(m[3])*255/100, parseFloat(m[4])*255/100, m[5] ? parseFloat(m[5]) : 1];
			}

			// Look for #a0b1c2
			if ( (m = /^\s*#([a-fA-F0-9]{2})([a-fA-F0-9]{2})([a-fA-F0-9]{2})\s*$/.exec(color)) ) {
				return [parseInt(m[1],16), parseInt(m[2],16), parseInt(m[3],16), 1];
			}

			// Look for #fff
			if ( (m = /^\s*#([a-fA-F0-9])([a-fA-F0-9])([a-fA-F0-9])\s*$/.exec(color)) ) {
				return [parseInt(m[1]+m[1],16), parseInt(m[2]+m[2],16), parseInt(m[3]+m[3],16), 1];
			}

			// Look for hsl(int,float%,float%) or hsla(int,float%,float%,float)
			if ( (m = /^\s*hsl(a)?\(\s*([0-9]{1,3})\s*,\s*([0-9]+(?:\.[0-9]+)?)\%\s*,\s*([0-9]+(?:\.[0-9]+)?)\%\s*(?:,\s*([0-9]+(?:\.[0-9]+)?)\s*)?\)\s*$/.exec(color)) && !m[1] === !m[5] ) {
				return [parseInt(m[2],10)/360, parseFloat(m[3])/100, parseFloat(m[4])/100, m[5] ? parseFloat(m[5]) : 1];
			}

			// Otherwise, we're most likely dealing with a named color
			return $.color.named(color);
		}

		// Check if we're already dealing with a color tuple
		if ( color && ( color.length === 3 || color.length === 4 ) ) {
			if ( color.length === 3 ) {
				color.push( 1 );
			}
			return color;
		}
	},

	named: function ( color ) {
		var result;
		color = $.trim(color.toLowerCase());

		// Check for transparent
		if ( color === "transparent" ) {
			return [0, 0, 0, 0];
		}

		$.each($.color.palette, function(n, palette) {
			if (palette[color]) {
				result = palette[color];
				return false;
			}
		});
		return result;
	}

});

})(jQuery)
);

/*
 * jQuery Colour Related Palette Generator 0.6
 *
 * Copyright (c) 2009 Adaptavist.com
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 *
 * Depends:
 *  color.object.js
 */
(jQuery.Color && (function($) {

// Generate a palette of related colours
$.Color.fn.related = function( offset ) {
	var i18n = $.Color.fn.related.i18n,
		off = offset || $.Color.fn.related.offset,
		offD = Math.round(off * 360) + i18n.deg;
	
	return {
		'anal-': this.analogous(-off).setName(i18n.anal + ' -' + offD),
		'anal0': this.analogous().setName(i18n.orig),
		'anal+': this.analogous(off).setName(i18n.anal + ' +' + offD),
		
		'comp-': this.complementary(-off).setName(i18n.split + ' -' + offD),
		'comp0': this.complementary().setName(i18n.comp),
		'comp+': this.complementary(off).setName(i18n.split + ' +' + offD),
		
		'triad-': this.analogous(-1/3).setName(i18n.triad + ' -120' + i18n.deg),
		'triad0': this.analogous().setName(i18n.orig),
		'triad+': this.analogous(1/3).setName(i18n.triad + ' +120' + i18n.deg)
	};
};

$.Color.fn.related.offset = 30/360;

$.Color.fn.related.i18n = {
	'deg': '°',
	'anal': 'Analogous',
	'orig': 'Original',
	'split': 'Split Complementary',
	'comp': 'Complementary',
	'triad': 'Triadic'
};

})(jQuery)
);

/*
 * jQuery Colour SVG/X11/CSS3 Palette 0.6
 *
 * Copyright (c) 2009 Adaptavist.com
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 *
 * Depends:
 *  color.core.js
 */
(jQuery.color && (function($) {

$.color.palette.css3 = {
	aliceblue:				[240,248,255],
	antiquewhite:			[250,235,215],
	aqua:					[0,255,255],
	aquamarine:				[127,255,212],
	azure:					[240,255,255],
	beige:					[245,245,220],
	bisque:					[255,228,196],
	black:					[0,0,0],
	blanchedalmond:			[255,235,205],
	blue:					[0,0,255],
	blueviolet:				[138,43,226],
	brown:					[165,42,42],
	burlywood:				[222,184,135],
	cadetblue:				[95,158,160],
	chartreuse:				[127,255,0],
	chocolate:				[210,105,30],
	coral:					[255,127,80],
	cornflowerblue:			[100,149,237],
	cornsilk:				[255,248,220],
	crimson:				[220,20,60],
	cyan:					[0,255,255],
	darkblue:				[0,0,139],
	darkcyan:				[0,139,139],
	darkgoldenrod:			[184,134,11],
	darkgray:				[169,169,169],
	darkgreen:				[0,100,0],
	darkgrey:				[169,169,169],
	darkkhaki:				[189,183,107],
	darkmagenta:			[139,0,139],
	darkolivegreen:			[85,107,47],
	darkorange:				[255,140,0],
	darkorchid:				[153,50,204],
	darkred:				[139,0,0],
	darksalmon:				[233,150,122],
	darkseagreen:			[143,188,143],
	darkslateblue:			[72,61,139],
	darkslategray:			[47,79,79],
	darkslategrey:			[47,79,79],
	darkturquoise:			[0,206,209],
	darkviolet:				[148,0,211],
	deeppink:				[255,20,147],
	deepskyblue:			[0,191,255],
	dimgray:				[105,105,105],
	dimgrey:				[105,105,105],
	dodgerblue:				[30,144,255],
	firebrick:				[178,34,34],
	floralwhite:			[255,250,240],
	forestgreen:			[34,139,34],
	fuchsia:				[255,0,255],
	gainsboro:				[220,220,220],
	ghostwhite:				[248,248,255],
	gold:					[255,215,0],
	goldenrod:				[218,165,32],
	gray:					[128,128,128],
	grey:					[128,128,128],
	green:					[0,128,0],
	greenyellow:			[173,255,47],
	honeydew:				[240,255,240],
	hotpink:				[255,105,180],
	indianred:				[205,92,92],
	indigo:					[75,0,130],
	ivory:					[255,255,240],
	khaki:					[240,230,140],
	lavender:				[230,230,250],
	lavenderblush:			[255,240,245],
	lawngreen:				[124,252,0],
	lemonchiffon:			[255,250,205],
	lightblue:				[173,216,230],
	lightcoral:				[240,128,128],
	lightcyan:				[224,255,255],
	lightgoldenrodyellow:	[250,250,210],
	lightgray:				[211,211,211],
	lightgreen:				[144,238,144],
	lightgrey:				[211,211,211],
	lightpink:				[255,182,193],
	lightsalmon:			[255,160,122],
	lightseagreen:			[32,178,170],
	lightskyblue:			[135,206,250],
	lightslategray:			[119,136,153],
	lightslategrey:			[119,136,153],
	lightsteelblue:			[176,196,222],
	lightyellow:			[255,255,224],
	lime:					[0,255,0],
	limegreen:				[50,205,50],
	linen:					[250,240,230],
	magenta:				[255,0,255],
	maroon:					[128,0,0],
	mediumaquamarine:		[102,205,170],
	mediumblue:				[0,0,205],
	mediumorchid:			[186,85,211],
	mediumpurple:			[147,112,219],
	mediumseagreen:			[60,179,113],
	mediumslateblue:		[123,104,238],
	mediumspringgreen:		[0,250,154],
	mediumturquoise:		[72,209,204],
	mediumvioletred:		[199,21,133],
	midnightblue:			[25,25,112],
	mintcream:				[245,255,250],
	mistyrose:				[255,228,225],
	moccasin:				[255,228,181],
	navajowhite:			[255,222,173],
	navy:					[0,0,128],
	oldlace:				[253,245,230],
	olive:					[128,128,0],
	olivedrab:				[107,142,35],
	orange:					[255,165,0],
	orangered:				[255,69,0],
	orchid:					[218,112,214],
	palegoldenrod:			[238,232,170],
	palegreen:				[152,251,152],
	paleturquoise:			[175,238,238],
	palevioletred:			[219,112,147],
	papayawhip:				[255,239,213],
	peachpuff:				[255,218,185],
	peru:					[205,133,63],
	pink:					[255,192,203],
	plum:					[221,160,221],
	powderblue:				[176,224,230],
	purple:					[128,0,128],
	red:					[255,0,0],
	rosybrown:				[188,143,143],
	royalblue:				[65,105,225],
	saddlebrown:			[139,69,19],
	salmon:					[250,128,114],
	sandybrown:				[244,164,96],
	seagreen:				[46,139,87],
	seashell:				[255,245,238],
	sienna:					[160,82,45],
	silver:					[192,192,192],
	skyblue:				[135,206,235],
	slateblue:				[106,90,205],
	slategray:				[112,128,144],
	slategrey:				[112,128,144],
	snow:					[255,250,250],
	springgreen:			[0,255,127],
	steelblue:				[70,130,180],
	tan:					[210,180,140],
	teal:					[0,128,128],
	thistle:				[216,191,216],
	tomato:					[255,99,71],
	turquoise:				[64,224,208],
	violet:					[238,130,238],
	wheat:					[245,222,179],
	white:					[255,255,255],
	whitesmoke:				[245,245,245],
	yellow:					[255,255,0],
	yellowgreen:			[154,205,50]
};

})(jQuery)
);

/*
 * jQuery CSS Colour Manipulation 0.6
 *
 * Copyright (c) 2010 Mark Gibson
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 *
 * Depends:
 *  color.core.js
 *  color.object.js
 */
(function($) {

	// Extract a CSS colour property as a Color object from the selection
	$.fn.cssColor = function(prop) {
		return $.Color(this.css(prop));
	};

	// Apply the colour to a CSS property on the selection
	$.Color.fn.applyCSS = function(selector, prop) {
		$(selector).css(prop, this.toCSS());
		return this;
	};

})(jQuery);


/* http://keith-wood.name/svg.html
   SVG for jQuery v1.4.4.
   Written by Keith Wood (kbwood{at}iinet.com.au) August 2007.
   Dual licensed under the GPL (http://dev.jquery.com/browser/trunk/jquery/GPL-LICENSE.txt) and 
   MIT (http://dev.jquery.com/browser/trunk/jquery/MIT-LICENSE.txt) licenses. 
   Please attribute the author if you use it. */

(function($) { // Hide scope, no $ conflict

/* SVG manager.
   Use the singleton instance of this class, $.svg, 
   to interact with the SVG functionality. */
function SVGManager() {
	this._settings = []; // Settings to be remembered per SVG object
	this._extensions = []; // List of SVG extensions added to SVGWrapper
		// for each entry [0] is extension name, [1] is extension class (function)
		// the function takes one parameter - the SVGWrapper instance
	this.regional = []; // Localisations, indexed by language, '' for default (English)
	this.regional[''] = {errorLoadingText: 'Error loading',
		notSupportedText: 'This browser does not support SVG'};
	this.local = this.regional['']; // Current localisation
	this._uuid = new Date().getTime();
	this._renesis = detectActiveX('RenesisX.RenesisCtrl');
}

/* Determine whether a given ActiveX control is available.
   @param  classId  (string) the ID for the ActiveX control
   @return  (boolean) true if found, false if not */
function detectActiveX(classId) {
	try {
		return !!(window.ActiveXObject && new ActiveXObject(classId));
	}
	catch (e) {
		return false;
	}
}

var PROP_NAME = 'svgwrapper';

$.extend(SVGManager.prototype, {
	/* Class name added to elements to indicate already configured with SVG. */
	markerClassName: 'hasSVG',

	/* SVG namespace. */
	svgNS: 'http://www.w3.org/2000/svg',
	/* XLink namespace. */
	xlinkNS: 'http://www.w3.org/1999/xlink',

	/* SVG wrapper class. */
	_wrapperClass: SVGWrapper,

	/* Camel-case versions of attribute names containing dashes or are reserved words. */
	_attrNames: {class_: 'class', in_: 'in',
		alignmentBaseline: 'alignment-baseline', baselineShift: 'baseline-shift',
		clipPath: 'clip-path', clipRule: 'clip-rule',
		colorInterpolation: 'color-interpolation',
		colorInterpolationFilters: 'color-interpolation-filters',
		colorRendering: 'color-rendering', dominantBaseline: 'dominant-baseline',
		enableBackground: 'enable-background', fillOpacity: 'fill-opacity',
		fillRule: 'fill-rule', floodColor: 'flood-color',
		floodOpacity: 'flood-opacity', fontFamily: 'font-family',
		fontSize: 'font-size', fontSizeAdjust: 'font-size-adjust',
		fontStretch: 'font-stretch', fontStyle: 'font-style',
		fontVariant: 'font-variant', fontWeight: 'font-weight',
		glyphOrientationHorizontal: 'glyph-orientation-horizontal',
		glyphOrientationVertical: 'glyph-orientation-vertical',
		horizAdvX: 'horiz-adv-x', horizOriginX: 'horiz-origin-x',
		imageRendering: 'image-rendering', letterSpacing: 'letter-spacing',
		lightingColor: 'lighting-color', markerEnd: 'marker-end',
		markerMid: 'marker-mid', markerStart: 'marker-start',
		stopColor: 'stop-color', stopOpacity: 'stop-opacity',
		strikethroughPosition: 'strikethrough-position',
		strikethroughThickness: 'strikethrough-thickness',
		strokeDashArray: 'stroke-dasharray', strokeDashOffset: 'stroke-dashoffset',
		strokeLineCap: 'stroke-linecap', strokeLineJoin: 'stroke-linejoin',
		strokeMiterLimit: 'stroke-miterlimit', strokeOpacity: 'stroke-opacity',
		strokeWidth: 'stroke-width', textAnchor: 'text-anchor',
		textDecoration: 'text-decoration', textRendering: 'text-rendering',
		underlinePosition: 'underline-position', underlineThickness: 'underline-thickness',
		vertAdvY: 'vert-adv-y', vertOriginY: 'vert-origin-y',
		wordSpacing: 'word-spacing', writingMode: 'writing-mode'},

	/* Add the SVG object to its container. */
	_attachSVG: function(container, settings) {
		var svg = (container.namespaceURI == this.svgNS ? container : null);
		var container = (svg ? null : container);
		if ($(container || svg).hasClass(this.markerClassName)) {
			return;
		}
		if (typeof settings == 'string') {
			settings = {loadURL: settings};
		}
		else if (typeof settings == 'function') {
			settings = {onLoad: settings};
		}
		$(container || svg).addClass(this.markerClassName);
		try {
			if (!svg) {
				svg = document.createElementNS(this.svgNS, 'svg');
				svg.setAttribute('version', '1.1');
				if (container.clientWidth > 0) {
					svg.setAttribute('width', container.clientWidth);
				}
				if (container.clientHeight > 0) {
					svg.setAttribute('height', container.clientHeight);
				}
				container.appendChild(svg);
			}
			this._afterLoad(container, svg, settings || {});
		}
		catch (e) {
			if ($.browser.msie) {
				if (!container.id) {
					container.id = 'svg' + (this._uuid++);
				}
				this._settings[container.id] = settings;
				container.innerHTML = '<embed type="image/svg+xml" width="100%" ' +
					'height="100%" src="' + (settings.initPath || '') + 'blank.svg" ' +
					'pluginspage="http://www.adobe.com/svg/viewer/install/main.html"/>';
			}
			else {
				container.innerHTML = '<p class="svg_error">' +
					this.local.notSupportedText + '</p>';
			}
		}
	},

	/* SVG callback after loading - register SVG root. */
	_registerSVG: function() {
		for (var i = 0; i < document.embeds.length; i++) { // Check all
			var container = document.embeds[i].parentNode;
			if (!$(container).hasClass($.svg.markerClassName) || // Not SVG
					$.data(container, PROP_NAME)) { // Already done
				continue;
			}
			var svg = null;
			try {
				svg = document.embeds[i].getSVGDocument();
			}
			catch(e) {
				setTimeout($.svg._registerSVG, 250); // Renesis takes longer to load
				return;
			}
			svg = (svg ? svg.documentElement : null);
			if (svg) {
				$.svg._afterLoad(container, svg);
			}
		}
	},

	/* Post-processing once loaded. */
	_afterLoad: function(container, svg, settings) {
		var settings = settings || this._settings[container.id];
		this._settings[container ? container.id : ''] = null;
		var wrapper = new this._wrapperClass(svg, container);
		$.data(container || svg, PROP_NAME, wrapper);
		try {
			if (settings.loadURL) { // Load URL
				wrapper.load(settings.loadURL, settings);
			}
			if (settings.settings) { // Additional settings
				wrapper.configure(settings.settings);
			}
			if (settings.onLoad && !settings.loadURL) { // Onload callback
				settings.onLoad.apply(container || svg, [wrapper]);
			}
		}
		catch (e) {
			alert(e);
		}
	},

	/* Return the SVG wrapper created for a given container.
	   @param  container  (string) selector for the container or
	                      (element) the container for the SVG object or
	                      jQuery collection - first entry is the container
	   @return  (SVGWrapper) the corresponding SVG wrapper element, or null if not attached */
	_getSVG: function(container) {
		container = (typeof container == 'string' ? $(container)[0] :
			(container.jquery ? container[0] : container));
		return $.data(container, PROP_NAME);
	},

	/* Remove the SVG functionality from a div.
	   @param  container  (element) the container for the SVG object */
	_destroySVG: function(container) {
		var $container = $(container);
		if (!$container.hasClass(this.markerClassName)) {
			return;
		}
		$container.removeClass(this.markerClassName);
		if (container.namespaceURI != this.svgNS) {
			$container.empty();
		}
		$.removeData(container, PROP_NAME);
	},

	/* Extend the SVGWrapper object with an embedded class.
	   The constructor function must take a single parameter that is
	   a reference to the owning SVG root object. This allows the 
	   extension to access the basic SVG functionality.
	   @param  name      (string) the name of the SVGWrapper attribute to access the new class
	   @param  extClass  (function) the extension class constructor */
	addExtension: function(name, extClass) {
		this._extensions.push([name, extClass]);
	},

	/* Does this node belong to SVG?
	   @param  node  (element) the node to be tested
	   @return  (boolean) true if an SVG node, false if not */
	isSVGElem: function(node) {
		return (node.nodeType == 1 && node.namespaceURI == $.svg.svgNS);
	}
});

/* The main SVG interface, which encapsulates the SVG element.
   Obtain a reference from $().svg('get') */
function SVGWrapper(svg, container) {
	this._svg = svg; // The SVG root node
	this._container = container; // The containing div
	for (var i = 0; i < $.svg._extensions.length; i++) {
		var extension = $.svg._extensions[i];
		this[extension[0]] = new extension[1](this);
	}
}

$.extend(SVGWrapper.prototype, {

	/* Retrieve the width of the SVG object. */
	_width: function() {
		return (this._container ? this._container.clientWidth : this._svg.width);
	},

	/* Retrieve the height of the SVG object. */
	_height: function() {
		return (this._container ? this._container.clientHeight : this._svg.height);
	},

	/* Retrieve the root SVG element.
	   @return  the top-level SVG element */
	root: function() {
		return this._svg;
	},

	/* Configure a SVG node.
	   @param  node      (element, optional) the node to configure
	   @param  settings  (object) additional settings for the root
	   @param  clear     (boolean) true to remove existing attributes first,
	                     false to add to what is already there (optional)
	   @return  (SVGWrapper) this root */
	configure: function(node, settings, clear) {
		if (!node.nodeName) {
			clear = settings;
			settings = node;
			node = this._svg;
		}
		if (clear) {
			for (var i = node.attributes.length - 1; i >= 0; i--) {
				var attr = node.attributes.item(i);
				if (!(attr.nodeName == 'onload' || attr.nodeName == 'version' || 
						attr.nodeName.substring(0, 5) == 'xmlns')) {
					node.attributes.removeNamedItem(attr.nodeName);
				}
			}
		}
		for (var attrName in settings) {
			node.setAttribute($.svg._attrNames[attrName] || attrName, settings[attrName]);
		}
		return this;
	},

	/* Locate a specific element in the SVG document.
	   @param  id  (string) the element's identifier
	   @return  (element) the element reference, or null if not found */
	getElementById: function(id) {
		return this._svg.ownerDocument.getElementById(id);
	},

	/* Change the attributes for a SVG node.
	   @param  element   (SVG element) the node to change
	   @param  settings  (object) the new settings
	   @return  (SVGWrapper) this root */
	change: function(element, settings) {
		if (element) {
			for (var name in settings) {
				if (settings[name] == null) {
					element.removeAttribute($.svg._attrNames[name] || name);
				}
				else {
					element.setAttribute($.svg._attrNames[name] || name, settings[name]);
				}
			}
		}
		return this;
	},

	/* Check for parent being absent and adjust arguments accordingly. */
	_args: function(values, names, optSettings) {
		names.splice(0, 0, 'parent');
		names.splice(names.length, 0, 'settings');
		var args = {};
		var offset = 0;
		if (values[0] != null && values[0].jquery) {
			values[0] = values[0][0];
		}
		if (values[0] != null && !(typeof values[0] == 'object' && values[0].nodeName)) {
			args['parent'] = null;
			offset = 1;
		}
		for (var i = 0; i < values.length; i++) {
			args[names[i + offset]] = values[i];
		}
		if (optSettings) {
			$.each(optSettings, function(i, value) {
				if (typeof args[value] == 'object') {
					args.settings = args[value];
					args[value] = null;
				}
			});
		}
		return args;
	},

	/* Add a title.
	   @param  parent    (element or jQuery) the parent node for the new title (optional)
	   @param  text      (string) the text of the title
	   @param  settings  (object) additional settings for the title (optional)
	   @return  (element) the new title node */
	title: function(parent, text, settings) {
		var args = this._args(arguments, ['text']);
		var node = this._makeNode(args.parent, 'title', args.settings || {});
		node.appendChild(this._svg.ownerDocument.createTextNode(args.text));
		return node;
	},

	/* Add a description.
	   @param  parent    (element or jQuery) the parent node for the new description (optional)
	   @param  text      (string) the text of the description
	   @param  settings  (object) additional settings for the description (optional)
	   @return  (element) the new description node */
	describe: function(parent, text, settings) {
		var args = this._args(arguments, ['text']);
		var node = this._makeNode(args.parent, 'desc', args.settings || {});
		node.appendChild(this._svg.ownerDocument.createTextNode(args.text));
		return node;
	},

	/* Add a definitions node.
	   @param  parent    (element or jQuery) the parent node for the new definitions (optional)
	   @param  id        (string) the ID of this definitions (optional)
	   @param  settings  (object) additional settings for the definitions (optional)
	   @return  (element) the new definitions node */
	defs: function(parent, id, settings) {
		var args = this._args(arguments, ['id'], ['id']);
		return this._makeNode(args.parent, 'defs', $.extend(
			(args.id ? {id: args.id} : {}), args.settings || {}));
	},

	/* Add a symbol definition.
	   @param  parent    (element or jQuery) the parent node for the new symbol (optional)
	   @param  id        (string) the ID of this symbol
	   @param  x1        (number) the left coordinate for this symbol
	   @param  y1        (number) the top coordinate for this symbol
	   @param  width     (number) the width of this symbol
	   @param  height    (number) the height of this symbol
	   @param  settings  (object) additional settings for the symbol (optional)
	   @return  (element) the new symbol node */
	symbol: function(parent, id, x1, y1, width, height, settings) {
		var args = this._args(arguments, ['id', 'x1', 'y1', 'width', 'height']);
		return this._makeNode(args.parent, 'symbol', $.extend({id: args.id,
			viewBox: args.x1 + ' ' + args.y1 + ' ' + args.width + ' ' + args.height},
			args.settings || {}));
	},

	/* Add a marker definition.
	   @param  parent    (element or jQuery) the parent node for the new marker (optional)
	   @param  id        (string) the ID of this marker
	   @param  refX      (number) the x-coordinate for the reference point
	   @param  refY      (number) the y-coordinate for the reference point
	   @param  mWidth    (number) the marker viewport width
	   @param  mHeight   (number) the marker viewport height
	   @param  orient    (string or int) 'auto' or angle (degrees) (optional)
	   @param  settings  (object) additional settings for the marker (optional)
	   @return  (element) the new marker node */
	marker: function(parent, id, refX, refY, mWidth, mHeight, orient, settings) {
		var args = this._args(arguments, ['id', 'refX', 'refY',
			'mWidth', 'mHeight', 'orient'], ['orient']);
		return this._makeNode(args.parent, 'marker', $.extend(
			{id: args.id, refX: args.refX, refY: args.refY, markerWidth: args.mWidth, 
			markerHeight: args.mHeight, orient: args.orient || 'auto'}, args.settings || {}));
	},

	/* Add a style node.
	   @param  parent    (element or jQuery) the parent node for the new node (optional)
	   @param  styles    (string) the CSS styles
	   @param  settings  (object) additional settings for the node (optional)
	   @return  (element) the new style node */
	style: function(parent, styles, settings) {
		var args = this._args(arguments, ['styles']);
		var node = this._makeNode(args.parent, 'style', $.extend(
			{type: 'text/css'}, args.settings || {}));
		node.appendChild(this._svg.ownerDocument.createTextNode(args.styles));
		if ($.browser.opera) {
			$('head').append('<style type="text/css">' + args.styles + '</style>');
		}
		return node;
	},

	/* Add a script node.
	   @param  parent    (element or jQuery) the parent node for the new node (optional)
	   @param  script    (string) the JavaScript code
	   @param  type      (string) the MIME type for the code (optional, default 'text/javascript')
	   @param  settings  (object) additional settings for the node (optional)
	   @return  (element) the new script node */
	script: function(parent, script, type, settings) {
		var args = this._args(arguments, ['script', 'type'], ['type']);
		var node = this._makeNode(args.parent, 'script', $.extend(
			{type: args.type || 'text/javascript'}, args.settings || {}));
		node.appendChild(this._svg.ownerDocument.createTextNode(args.script));
		if (!$.browser.mozilla) {
			$.globalEval(args.script);
		}
		return node;
	},

	/* Add a linear gradient definition.
	   Specify all of x1, y1, x2, y2 or none of them.
	   @param  parent    (element or jQuery) the parent node for the new gradient (optional)
	   @param  id        (string) the ID for this gradient
	   @param  stops     (string[][]) the gradient stops, each entry is
	                     [0] is offset (0.0-1.0 or 0%-100%), [1] is colour, 
						 [2] is opacity (optional)
	   @param  x1        (number) the x-coordinate of the gradient start (optional)
	   @param  y1        (number) the y-coordinate of the gradient start (optional)
	   @param  x2        (number) the x-coordinate of the gradient end (optional)
	   @param  y2        (number) the y-coordinate of the gradient end (optional)
	   @param  settings  (object) additional settings for the gradient (optional)
	   @return  (element) the new gradient node */
	linearGradient: function(parent, id, stops, x1, y1, x2, y2, settings) {
		var args = this._args(arguments,
			['id', 'stops', 'x1', 'y1', 'x2', 'y2'], ['x1']);
		var sets = $.extend({id: args.id}, 
			(args.x1 != null ? {x1: args.x1, y1: args.y1, x2: args.x2, y2: args.y2} : {}));
		return this._gradient(args.parent, 'linearGradient', 
			$.extend(sets, args.settings || {}), args.stops);
	},

	/* Add a radial gradient definition.
	   Specify all of cx, cy, r, fx, fy or none of them.
	   @param  parent    (element or jQuery) the parent node for the new gradient (optional)
	   @param  id        (string) the ID for this gradient
	   @param  stops     (string[][]) the gradient stops, each entry
	                     [0] is offset, [1] is colour, [2] is opacity (optional)
	   @param  cx        (number) the x-coordinate of the largest circle centre (optional)
	   @param  cy        (number) the y-coordinate of the largest circle centre (optional)
	   @param  r         (number) the radius of the largest circle (optional)
	   @param  fx        (number) the x-coordinate of the gradient focus (optional)
	   @param  fy        (number) the y-coordinate of the gradient focus (optional)
	   @param  settings  (object) additional settings for the gradient (optional)
	   @return  (element) the new gradient node */
	radialGradient: function(parent, id, stops, cx, cy, r, fx, fy, settings) {
		var args = this._args(arguments,
			['id', 'stops', 'cx', 'cy', 'r', 'fx', 'fy'], ['cx']);
		var sets = $.extend({id: args.id}, (args.cx != null ?
			{cx: args.cx, cy: args.cy, r: args.r, fx: args.fx, fy: args.fy} : {}));
		return this._gradient(args.parent, 'radialGradient', 
			$.extend(sets, args.settings || {}), args.stops);
	},

	/* Add a gradient node. */
	_gradient: function(parent, name, settings, stops) {
		var node = this._makeNode(parent, name, settings);
		for (var i = 0; i < stops.length; i++) {
			var stop = stops[i];
			this._makeNode(node, 'stop', $.extend(
				{offset: stop[0], stopColor: stop[1]}, 
				(stop[2] != null ? {stopOpacity: stop[2]} : {})));
		}
		return node;
	},

	/* Add a pattern definition.
	   Specify all of vx, vy, xwidth, vheight or none of them.
	   @param  parent    (element or jQuery) the parent node for the new pattern (optional)
	   @param  id        (string) the ID for this pattern
	   @param  x         (number) the x-coordinate for the left edge of the pattern
	   @param  y         (number) the y-coordinate for the top edge of the pattern
	   @param  width     (number) the width of the pattern
	   @param  height    (number) the height of the pattern
	   @param  vx        (number) the minimum x-coordinate for view box (optional)
	   @param  vy        (number) the minimum y-coordinate for the view box (optional)
	   @param  vwidth    (number) the width of the view box (optional)
	   @param  vheight   (number) the height of the view box (optional)
	   @param  settings  (object) additional settings for the pattern (optional)
	   @return  (element) the new pattern node */
	pattern: function(parent, id, x, y, width, height, vx, vy, vwidth, vheight, settings) {
		var args = this._args(arguments, ['id', 'x', 'y', 'width', 'height',
			'vx', 'vy', 'vwidth', 'vheight'], ['vx']);
		var sets = $.extend({id: args.id, x: args.x, y: args.y,
			width: args.width, height: args.height}, (args.vx != null ?
			{viewBox: args.vx + ' ' + args.vy + ' ' + args.vwidth + ' ' + args.vheight} : {}));
		return this._makeNode(args.parent, 'pattern', $.extend(sets, args.settings || {}));
	},

	/* Add a clip path definition.
	   @param  parent  (element) the parent node for the new element (optional)
	   @param  id      (string) the ID for this path
	   @param  units   (string) either 'userSpaceOnUse' (default) or 'objectBoundingBox' (optional)
	   @return  (element) the new clipPath node */
	clipPath: function(parent, id, units, settings) {
		var args = this._args(arguments, ['id', 'units']);
		args.units = args.units || 'userSpaceOnUse';
		return this._makeNode(args.parent, 'clipPath', $.extend(
			{id: args.id, clipPathUnits: args.units}, args.settings || {}));
	},

	/* Add a mask definition.
	   @param  parent    (element or jQuery) the parent node for the new mask (optional)
	   @param  id        (string) the ID for this mask
	   @param  x         (number) the x-coordinate for the left edge of the mask
	   @param  y         (number) the y-coordinate for the top edge of the mask
	   @param  width     (number) the width of the mask
	   @param  height    (number) the height of the mask
	   @param  settings  (object) additional settings for the mask (optional)
	   @return  (element) the new mask node */
	mask: function(parent, id, x, y, width, height, settings) {
		var args = this._args(arguments, ['id', 'x', 'y', 'width', 'height']);
		return this._makeNode(args.parent, 'mask', $.extend(
			{id: args.id, x: args.x, y: args.y, width: args.width, height: args.height},
			args.settings || {}));
	},

	/* Create a new path object.
	   @return  (SVGPath) a new path object */
	createPath: function() {
		return new SVGPath();
	},

	/* Create a new text object.
	   @return  (SVGText) a new text object */
	createText: function() {
		return new SVGText();
	},

	/* Add an embedded SVG element.
	   Specify all of vx, vy, vwidth, vheight or none of them.
	   @param  parent    (element or jQuery) the parent node for the new node (optional)
	   @param  x         (number) the x-coordinate for the left edge of the node
	   @param  y         (number) the y-coordinate for the top edge of the node
	   @param  width     (number) the width of the node
	   @param  height    (number) the height of the node
	   @param  vx        (number) the minimum x-coordinate for view box (optional)
	   @param  vy        (number) the minimum y-coordinate for the view box (optional)
	   @param  vwidth    (number) the width of the view box (optional)
	   @param  vheight   (number) the height of the view box (optional)
	   @param  settings  (object) additional settings for the node (optional)
	   @return  (element) the new node */
	svg: function(parent, x, y, width, height, vx, vy, vwidth, vheight, settings) {
		var args = this._args(arguments, ['x', 'y', 'width', 'height',
			'vx', 'vy', 'vwidth', 'vheight'], ['vx']);
		var sets = $.extend({x: args.x, y: args.y, width: args.width, height: args.height}, 
			(args.vx != null ? {viewBox: args.vx + ' ' + args.vy + ' ' +
			args.vwidth + ' ' + args.vheight} : {}));
		return this._makeNode(args.parent, 'svg', $.extend(sets, args.settings || {}));
	},

	/* Create a group.
	   @param  parent    (element or jQuery) the parent node for the new group (optional)
	   @param  id        (string) the ID of this group (optional)
	   @param  settings  (object) additional settings for the group (optional)
	   @return  (element) the new group node */
	group: function(parent, id, settings) {
		var args = this._args(arguments, ['id'], ['id']);
		return this._makeNode(args.parent, 'g', $.extend({id: args.id}, args.settings || {}));
	},

	/* Add a usage reference.
	   Specify all of x, y, width, height or none of them.
	   @param  parent    (element or jQuery) the parent node for the new node (optional)
	   @param  x         (number) the x-coordinate for the left edge of the node (optional)
	   @param  y         (number) the y-coordinate for the top edge of the node (optional)
	   @param  width     (number) the width of the node (optional)
	   @param  height    (number) the height of the node (optional)
	   @param  ref       (string) the ID of the definition node
	   @param  settings  (object) additional settings for the node (optional)
	   @return  (element) the new node */
	use: function(parent, x, y, width, height, ref, settings) {
		var args = this._args(arguments, ['x', 'y', 'width', 'height', 'ref']);
		if (typeof args.x == 'string') {
			args.ref = args.x;
			args.settings = args.y;
			args.x = args.y = args.width = args.height = null;
		}
		var node = this._makeNode(args.parent, 'use', $.extend(
			{x: args.x, y: args.y, width: args.width, height: args.height},
			args.settings || {}));
		node.setAttributeNS($.svg.xlinkNS, 'href', args.ref);
		return node;
	},

	/* Add a link, which applies to all child elements.
	   @param  parent    (element or jQuery) the parent node for the new link (optional)
	   @param  ref       (string) the target URL
	   @param  settings  (object) additional settings for the link (optional)
	   @return  (element) the new link node */
	link: function(parent, ref, settings) {
		var args = this._args(arguments, ['ref']);
		var node = this._makeNode(args.parent, 'a', args.settings);
		node.setAttributeNS($.svg.xlinkNS, 'href', args.ref);
		return node;
	},

	/* Add an image.
	   @param  parent    (element or jQuery) the parent node for the new image (optional)
	   @param  x         (number) the x-coordinate for the left edge of the image
	   @param  y         (number) the y-coordinate for the top edge of the image
	   @param  width     (number) the width of the image
	   @param  height    (number) the height of the image
	   @param  ref       (string) the path to the image
	   @param  settings  (object) additional settings for the image (optional)
	   @return  (element) the new image node */
	image: function(parent, x, y, width, height, ref, settings) {
		var args = this._args(arguments, ['x', 'y', 'width', 'height', 'ref']);
		var node = this._makeNode(args.parent, 'image', $.extend(
			{x: args.x, y: args.y, width: args.width, height: args.height},
			args.settings || {}));
		node.setAttributeNS($.svg.xlinkNS, 'href', args.ref);
		return node;
	},

	/* Draw a path.
	   @param  parent    (element or jQuery) the parent node for the new shape (optional)
	   @param  path      (string or SVGPath) the path to draw
	   @param  settings  (object) additional settings for the shape (optional)
	   @return  (element) the new shape node */
	path: function(parent, path, settings) {
		var args = this._args(arguments, ['path']);
		return this._makeNode(args.parent, 'path', $.extend(
			{d: (args.path.path ? args.path.path() : args.path)}, args.settings || {}));
	},

	/* Draw a rectangle.
	   Specify both of rx and ry or neither.
	   @param  parent    (element or jQuery) the parent node for the new shape (optional)
	   @param  x         (number) the x-coordinate for the left edge of the rectangle
	   @param  y         (number) the y-coordinate for the top edge of the rectangle
	   @param  width     (number) the width of the rectangle
	   @param  height    (number) the height of the rectangle
	   @param  rx        (number) the x-radius of the ellipse for the rounded corners (optional)
	   @param  ry        (number) the y-radius of the ellipse for the rounded corners (optional)
	   @param  settings  (object) additional settings for the shape (optional)
	   @return  (element) the new shape node */
	rect: function(parent, x, y, width, height, rx, ry, settings) {
		var args = this._args(arguments, ['x', 'y', 'width', 'height', 'rx', 'ry'], ['rx']);
		return this._makeNode(args.parent, 'rect', $.extend(
			{x: args.x, y: args.y, width: args.width, height: args.height},
			(args.rx ? {rx: args.rx, ry: args.ry} : {}), args.settings || {}));
	},

	/* Draw a circle.
	   @param  parent    (element or jQuery) the parent node for the new shape (optional)
	   @param  cx        (number) the x-coordinate for the centre of the circle
	   @param  cy        (number) the y-coordinate for the centre of the circle
	   @param  r         (number) the radius of the circle
	   @param  settings  (object) additional settings for the shape (optional)
	   @return  (element) the new shape node */
	circle: function(parent, cx, cy, r, settings) {
		var args = this._args(arguments, ['cx', 'cy', 'r']);
		return this._makeNode(args.parent, 'circle', $.extend(
			{cx: args.cx, cy: args.cy, r: args.r}, args.settings || {}));
	},

	/* Draw an ellipse.
	   @param  parent    (element or jQuery) the parent node for the new shape (optional)
	   @param  cx        (number) the x-coordinate for the centre of the ellipse
	   @param  cy        (number) the y-coordinate for the centre of the ellipse
	   @param  rx        (number) the x-radius of the ellipse
	   @param  ry        (number) the y-radius of the ellipse
	   @param  settings  (object) additional settings for the shape (optional)
	   @return  (element) the new shape node */
	ellipse: function(parent, cx, cy, rx, ry, settings) {
		var args = this._args(arguments, ['cx', 'cy', 'rx', 'ry']);
		return this._makeNode(args.parent, 'ellipse', $.extend(
			{cx: args.cx, cy: args.cy, rx: args.rx, ry: args.ry}, args.settings || {}));
	},

	/* Draw a line.
	   @param  parent    (element or jQuery) the parent node for the new shape (optional)
	   @param  x1        (number) the x-coordinate for the start of the line
	   @param  y1        (number) the y-coordinate for the start of the line
	   @param  x2        (number) the x-coordinate for the end of the line
	   @param  y2        (number) the y-coordinate for the end of the line
	   @param  settings  (object) additional settings for the shape (optional)
	   @return  (element) the new shape node */
	line: function(parent, x1, y1, x2, y2, settings) {
		var args = this._args(arguments, ['x1', 'y1', 'x2', 'y2']);
		return this._makeNode(args.parent, 'line', $.extend(
			{x1: args.x1, y1: args.y1, x2: args.x2, y2: args.y2}, args.settings || {}));
	},

	/* Draw a polygonal line.
	   @param  parent    (element or jQuery) the parent node for the new shape (optional)
	   @param  points    (number[][]) the x-/y-coordinates for the points on the line
	   @param  settings  (object) additional settings for the shape (optional)
	   @return  (element) the new shape node */
	polyline: function(parent, points, settings) {
		var args = this._args(arguments, ['points']);
		return this._poly(args.parent, 'polyline', args.points, args.settings);
	},

	/* Draw a polygonal shape.
	   @param  parent    (element or jQuery) the parent node for the new shape (optional)
	   @param  points    (number[][]) the x-/y-coordinates for the points on the shape
	   @param  settings  (object) additional settings for the shape (optional)
	   @return  (element) the new shape node */
	polygon: function(parent, points, settings) {
		var args = this._args(arguments, ['points']);
		return this._poly(args.parent, 'polygon', args.points, args.settings);
	},

	/* Draw a polygonal line or shape. */
	_poly: function(parent, name, points, settings) {
		var ps = '';
		for (var i = 0; i < points.length; i++) {
			ps += points[i].join() + ' ';
		}
		return this._makeNode(parent, name, $.extend(
			{points: $.trim(ps)}, settings || {}));
	},

	/* Draw text.
	   Specify both of x and y or neither of them.
	   @param  parent    (element or jQuery) the parent node for the text (optional)
	   @param  x         (number or number[]) the x-coordinate(s) for the text (optional)
	   @param  y         (number or number[]) the y-coordinate(s) for the text (optional)
	   @param  value     (string) the text content or
	                     (SVGText) text with spans and references
	   @param  settings  (object) additional settings for the text (optional)
	   @return  (element) the new text node */
	text: function(parent, x, y, value, settings) {
		var args = this._args(arguments, ['x', 'y', 'value']);
		if (typeof args.x == 'string' && arguments.length < 4) {
			args.value = args.x;
			args.settings = args.y;
			args.x = args.y = null;
		}
		return this._text(args.parent, 'text', args.value, $.extend(
			{x: (args.x && isArray(args.x) ? args.x.join(' ') : args.x),
			y: (args.y && isArray(args.y) ? args.y.join(' ') : args.y)}, 
			args.settings || {}));
	},

	/* Draw text along a path.
	   @param  parent    (element or jQuery) the parent node for the text (optional)
	   @param  path      (string) the ID of the path
	   @param  value     (string) the text content or
	                     (SVGText) text with spans and references
	   @param  settings  (object) additional settings for the text (optional)
	   @return  (element) the new text node */
	textpath: function(parent, path, value, settings) {
		var args = this._args(arguments, ['path', 'value']);
		var node = this._text(args.parent, 'textPath', args.value, args.settings || {});
		node.setAttributeNS($.svg.xlinkNS, 'href', args.path);
		return node;
	},

	/* Draw text. */
	_text: function(parent, name, value, settings) {
		var node = this._makeNode(parent, name, settings);
		if (typeof value == 'string') {
			node.appendChild(node.ownerDocument.createTextNode(value));
		}
		else {
			for (var i = 0; i < value._parts.length; i++) {
				var part = value._parts[i];
				if (part[0] == 'tspan') {
					var child = this._makeNode(node, part[0], part[2]);
					child.appendChild(node.ownerDocument.createTextNode(part[1]));
					node.appendChild(child);
				}
				else if (part[0] == 'tref') {
					var child = this._makeNode(node, part[0], part[2]);
					child.setAttributeNS($.svg.xlinkNS, 'href', part[1]);
					node.appendChild(child);
				}
				else if (part[0] == 'textpath') {
					var set = $.extend({}, part[2]);
					set.href = null;
					var child = this._makeNode(node, part[0], set);
					child.setAttributeNS($.svg.xlinkNS, 'href', part[2].href);
					child.appendChild(node.ownerDocument.createTextNode(part[1]));
					node.appendChild(child);
				}
				else { // straight text
					node.appendChild(node.ownerDocument.createTextNode(part[1]));
				}
			}
		}
		return node;
	},

	/* Add a custom SVG element.
	   @param  parent    (element or jQuery) the parent node for the new element (optional)
	   @param  name      (string) the name of the element
	   @param  settings  (object) additional settings for the element (optional)
	   @return  (element) the new custom node */
	other: function(parent, name, settings) {
		var args = this._args(arguments, ['name']);
		return this._makeNode(args.parent, args.name, args.settings || {});
	},

	/* Create a shape node with the given settings. */
	_makeNode: function(parent, name, settings) {
		parent = parent || this._svg;
		var node = this._svg.ownerDocument.createElementNS($.svg.svgNS, name);
		for (var name in settings) {
			var value = settings[name];
			if (value != null && value != null && 
					(typeof value != 'string' || value != '')) {
				node.setAttribute($.svg._attrNames[name] || name, value);
			}
		}
		parent.appendChild(node);
		return node;
	},

	/* Add an existing SVG node to the diagram.
	   @param  parent  (element or jQuery) the parent node for the new node (optional)
	   @param  node    (element) the new node to add or
	                   (string) the jQuery selector for the node or
	                   (jQuery collection) set of nodes to add
	   @return  (SVGWrapper) this wrapper */
	add: function(parent, node) {
		var args = this._args((arguments.length == 1 ? [null, parent] : arguments), ['node']);
		var svg = this;
		args.parent = args.parent || this._svg;
		args.node = (args.node.jquery ? args.node : $(args.node));
		try {
			if ($.svg._renesis) {
				throw 'Force traversal';
			}
			args.parent.appendChild(args.node.cloneNode(true));
		}
		catch (e) {
			args.node.each(function() {
				var child = svg._cloneAsSVG(this);
				if (child) {
					args.parent.appendChild(child);
				}
			});
		}
		return this;
	},

	/* Clone an existing SVG node and add it to the diagram.
	   @param  parent  (element or jQuery) the parent node for the new node (optional)
	   @param  node    (element) the new node to add or
	                   (string) the jQuery selector for the node or
	                   (jQuery collection) set of nodes to add
	   @return  (element[]) collection of new nodes */
	clone: function(parent, node) {
		var svg = this;
		var args = this._args((arguments.length == 1 ? [null, parent] : arguments), ['node']);
		args.parent = args.parent || this._svg;
		args.node = (args.node.jquery ? args.node : $(args.node));
		var newNodes = [];
		args.node.each(function() {
			var child = svg._cloneAsSVG(this);
			if (child) {
				child.id = '';
				args.parent.appendChild(child);
				newNodes.push(child);
			}
		});
		return newNodes;
	},

	/* SVG nodes must belong to the SVG namespace, so clone and ensure this is so.
	   @param  node  (element) the SVG node to clone
	   @return  (element) the cloned node */
	_cloneAsSVG: function(node) {
		var newNode = null;
		if (node.nodeType == 1) { // element
			newNode = this._svg.ownerDocument.createElementNS(
				$.svg.svgNS, this._checkName(node.nodeName));
			for (var i = 0; i < node.attributes.length; i++) {
				var attr = node.attributes.item(i);
				if (attr.nodeName != 'xmlns' && attr.nodeValue) {
					if (attr.prefix == 'xlink') {
						newNode.setAttributeNS($.svg.xlinkNS,
							attr.localName || attr.baseName, attr.nodeValue);
					}
					else {
						newNode.setAttribute(this._checkName(attr.nodeName), attr.nodeValue);
					}
				}
			}
			for (var i = 0; i < node.childNodes.length; i++) {
				var child = this._cloneAsSVG(node.childNodes[i]);
				if (child) {
					newNode.appendChild(child);
				}
			}
		}
		else if (node.nodeType == 3) { // text
			if ($.trim(node.nodeValue)) {
				newNode = this._svg.ownerDocument.createTextNode(node.nodeValue);
			}
		}
		else if (node.nodeType == 4) { // CDATA
			if ($.trim(node.nodeValue)) {
				try {
					newNode = this._svg.ownerDocument.createCDATASection(node.nodeValue);
				}
				catch (e) {
					newNode = this._svg.ownerDocument.createTextNode(
						node.nodeValue.replace(/&/g, '&amp;').
						replace(/</g, '&lt;').replace(/>/g, '&gt;'));
				}
			}
		}
		return newNode;
	},

	/* Node names must be lower case and without SVG namespace prefix. */
	_checkName: function(name) {
		name = (name.substring(0, 1) >= 'A' && name.substring(0, 1) <= 'Z' ?
			name.toLowerCase() : name);
		return (name.substring(0, 4) == 'svg:' ? name.substring(4) : name);
	},

	/* Load an external SVG document.
	   @param  url       (string) the location of the SVG document or
	                     the actual SVG content
	   @param  settings  (boolean) see addTo below or
	                     (function) see onLoad below or
	                     (object) additional settings for the load with attributes below:
	                       addTo       (boolean) true to add to what's already there,
	                                   or false to clear the canvas first
						   changeSize  (boolean) true to allow the canvas size to change,
	                                   or false to retain the original
	                       onLoad      (function) callback after the document has loaded,
	                                   'this' is the container, receives SVG object and
	                                   optional error message as a parameter
	                       parent      (string or element or jQuery) the parent to load
	                                   into, defaults to top-level svg element
	   @return  (SVGWrapper) this root */
	load: function(url, settings) {
		settings = (typeof settings == 'boolean' ? {addTo: settings} :
			(typeof settings == 'function' ? {onLoad: settings} :
			(typeof settings == 'string' ? {parent: settings} : 
			(typeof settings == 'object' && settings.nodeName ? {parent: settings} :
			(typeof settings == 'object' && settings.jquery ? {parent: settings} :
			settings || {})))));
		if (!settings.parent && !settings.addTo) {
			this.clear(false);
		}
		var size = [this._svg.getAttribute('width'), this._svg.getAttribute('height')];
		var wrapper = this;
		// Report a problem with the load
		var reportError = function(message) {
			message = $.svg.local.errorLoadingText + ': ' + message;
			if (settings.onLoad) {
				settings.onLoad.apply(wrapper._container || wrapper._svg, [wrapper, message]);
			}
			else {
				wrapper.text(null, 10, 20, message);
			}
		};
		// Create a DOM from SVG content
		var loadXML4IE = function(data) {
			var xml = new ActiveXObject('Microsoft.XMLDOM');
			xml.validateOnParse = false;
			xml.resolveExternals = false;
			xml.async = false;
			xml.loadXML(data);
			if (xml.parseError.errorCode != 0) {
				reportError(xml.parseError.reason);
				return null;
			}
			return xml;
		};
		// Load the SVG DOM
		var loadSVG = function(data) {
			if (!data) {
				return;
			}
			if (data.documentElement.nodeName != 'svg') {
				var errors = data.getElementsByTagName('parsererror');
				var messages = (errors.length ? errors[0].getElementsByTagName('div') : []); // Safari
				reportError(!errors.length ? '???' :
					(messages.length ? messages[0] : errors[0]).firstChild.nodeValue);
				return;
			}
			var parent = (settings.parent ? $(settings.parent)[0] : wrapper._svg);
			var attrs = {};
			for (var i = 0; i < data.documentElement.attributes.length; i++) {
				var attr = data.documentElement.attributes.item(i);
				if (!(attr.nodeName == 'version' || attr.nodeName.substring(0, 5) == 'xmlns')) {
					attrs[attr.nodeName] = attr.nodeValue;
				}
			}
			wrapper.configure(parent, attrs, !settings.parent);
			var nodes = data.documentElement.childNodes;
			for (var i = 0; i < nodes.length; i++) {
				try {
					if ($.svg._renesis) {
						throw 'Force traversal';
					}
					parent.appendChild(wrapper._svg.ownerDocument.importNode(nodes[i], true));
					if (nodes[i].nodeName == 'script') {
						$.globalEval(nodes[i].textContent);
					}
				}
				catch (e) {
					wrapper.add(parent, nodes[i]);
				}
			}
			if (!settings.changeSize) {
				wrapper.configure(parent, {width: size[0], height: size[1]});
			}
			if (settings.onLoad) {
				settings.onLoad.apply(wrapper._container || wrapper._svg, [wrapper]);
			}
		};
		if (url.match('<svg')) { // Inline SVG
			loadSVG($.browser.msie ? loadXML4IE(url) :
				new DOMParser().parseFromString(url, 'text/xml'));
		}
		else { // Remote SVG
			$.ajax({url: url, dataType: ($.browser.msie ? 'text' : 'xml'),
				success: function(xml) {
					loadSVG($.browser.msie ? loadXML4IE(xml) : xml);
				}, error: function(http, message, exc) {
					reportError(message + (exc ? ' ' + exc.message : ''));
				}});
		}
		return this;
	},

	/* Delete a specified node.
	   @param  node  (element or jQuery) the drawing node to remove
	   @return  (SVGWrapper) this root */
	remove: function(node) {
		node = (node.jquery ? node[0] : node);
		node.parentNode.removeChild(node);
		return this;
	},

	/* Delete everything in the current document.
	   @param  attrsToo  (boolean) true to clear any root attributes as well,
	                     false to leave them (optional)
	   @return  (SVGWrapper) this root */
	clear: function(attrsToo) {
		if (attrsToo) {
			this.configure({}, true);
		}
		while (this._svg.firstChild) {
			this._svg.removeChild(this._svg.firstChild);
		}
		return this;
	},

	/* Serialise the current diagram into an SVG text document.
	   @param  node  (SVG element) the starting node (optional)
	   @return  (string) the SVG as text */
	toSVG: function(node) {
		node = node || this._svg;
		return (typeof XMLSerializer == 'undefined' ? this._toSVG(node) :
			new XMLSerializer().serializeToString(node));
	},

	/* Serialise one node in the SVG hierarchy. */
	_toSVG: function(node) {
		var svgDoc = '';
		if (!node) {
			return svgDoc;
		}
		if (node.nodeType == 3) { // Text
			svgDoc = node.nodeValue;
		}
		else if (node.nodeType == 4) { // CDATA
			svgDoc = '<![CDATA[' + node.nodeValue + ']]>';
		}
		else { // Element
			svgDoc = '<' + node.nodeName;
			if (node.attributes) {
				for (var i = 0; i < node.attributes.length; i++) {
					var attr = node.attributes.item(i);
					if (!($.trim(attr.nodeValue) == '' || attr.nodeValue.match(/^\[object/) ||
							attr.nodeValue.match(/^function/))) {
						svgDoc += ' ' + (attr.namespaceURI == $.svg.xlinkNS ? 'xlink:' : '') + 
							attr.nodeName + '="' + attr.nodeValue + '"';
					}
				}
			}	
			if (node.firstChild) {
				svgDoc += '>';
				var child = node.firstChild;
				while (child) {
					svgDoc += this._toSVG(child);
					child = child.nextSibling;
				}
				svgDoc += '</' + node.nodeName + '>';
			}
				else {
				svgDoc += '/>';
			}
		}
		return svgDoc;
	}
});

/* Helper to generate an SVG path.
   Obtain an instance from the SVGWrapper object.
   String calls together to generate the path and use its value:
   var path = root.createPath();
   root.path(null, path.move(100, 100).line(300, 100).line(200, 300).close(), {fill: 'red'});
   or
   root.path(null, path.move(100, 100).line([[300, 100], [200, 300]]).close(), {fill: 'red'}); */
function SVGPath() {
	this._path = '';
}

$.extend(SVGPath.prototype, {
	/* Prepare to create a new path.
	   @return  (SVGPath) this path */
	reset: function() {
		this._path = '';
		return this;
	},

	/* Move the pointer to a position.
	   @param  x         (number) x-coordinate to move to or
	                     (number[][]) x-/y-coordinates to move to
	   @param  y         (number) y-coordinate to move to (omitted if x is array)
	   @param  relative  (boolean) true for coordinates relative to the current point,
	                     false for coordinates being absolute
	   @return  (SVGPath) this path */
	move: function(x, y, relative) {
		relative = (isArray(x) ? y : relative);
		return this._coords((relative ? 'm' : 'M'), x, y);
	},

	/* Draw a line to a position.
	   @param  x         (number) x-coordinate to move to or
	                     (number[][]) x-/y-coordinates to move to
	   @param  y         (number) y-coordinate to move to (omitted if x is array)
	   @param  relative  (boolean) true for coordinates relative to the current point,
	                     false for coordinates being absolute
	   @return  (SVGPath) this path */
	line: function(x, y, relative) {
		relative = (isArray(x) ? y : relative);
		return this._coords((relative ? 'l' : 'L'), x, y);
	},

	/* Draw a horizontal line to a position.
	   @param  x         (number) x-coordinate to draw to or
	                     (number[]) x-coordinates to draw to
	   @param  relative  (boolean) true for coordinates relative to the current point,
	                     false for coordinates being absolute
	   @return  (SVGPath) this path */
	horiz: function(x, relative) {
		this._path += (relative ? 'h' : 'H') + (isArray(x) ? x.join(' ') : x);
		return this;
	},

	/* Draw a vertical line to a position.
	   @param  y         (number) y-coordinate to draw to or
	                     (number[]) y-coordinates to draw to
	   @param  relative  (boolean) true for coordinates relative to the current point,
	                     false for coordinates being absolute
	   @return  (SVGPath) this path */
	vert: function(y, relative) {
		this._path += (relative ? 'v' : 'V') + (isArray(y) ? y.join(' ') : y);
		return this;
	},

	/* Draw a cubic Bézier curve.
	   @param  x1        (number) x-coordinate of beginning control point or
	                     (number[][]) x-/y-coordinates of control and end points to draw to
	   @param  y1        (number) y-coordinate of beginning control point (omitted if x1 is array)
	   @param  x2        (number) x-coordinate of ending control point (omitted if x1 is array)
	   @param  y2        (number) y-coordinate of ending control point (omitted if x1 is array)
	   @param  x         (number) x-coordinate of curve end (omitted if x1 is array)
	   @param  y         (number) y-coordinate of curve end (omitted if x1 is array)
	   @param  relative  (boolean) true for coordinates relative to the current point,
	                     false for coordinates being absolute
	   @return  (SVGPath) this path */
	curveC: function(x1, y1, x2, y2, x, y, relative) {
		relative = (isArray(x1) ? y1 : relative);
		return this._coords((relative ? 'c' : 'C'), x1, y1, x2, y2, x, y);
	},

	/* Continue a cubic Bézier curve.
	   Starting control point is the reflection of the previous end control point.
	   @param  x2        (number) x-coordinate of ending control point or
	                     (number[][]) x-/y-coordinates of control and end points to draw to
	   @param  y2        (number) y-coordinate of ending control point (omitted if x2 is array)
	   @param  x         (number) x-coordinate of curve end (omitted if x2 is array)
	   @param  y         (number) y-coordinate of curve end (omitted if x2 is array)
	   @param  relative  (boolean) true for coordinates relative to the current point,
	                     false for coordinates being absolute
	   @return  (SVGPath) this path */
	smoothC: function(x2, y2, x, y, relative) {
		relative = (isArray(x2) ? y2 : relative);
		return this._coords((relative ? 's' : 'S'), x2, y2, x, y);
	},

	/* Draw a quadratic Bézier curve.
	   @param  x1        (number) x-coordinate of control point or
	                     (number[][]) x-/y-coordinates of control and end points to draw to
	   @param  y1        (number) y-coordinate of control point (omitted if x1 is array)
	   @param  x         (number) x-coordinate of curve end (omitted if x1 is array)
	   @param  y         (number) y-coordinate of curve end (omitted if x1 is array)
	   @param  relative  (boolean) true for coordinates relative to the current point,
	                     false for coordinates being absolute
	   @return  (SVGPath) this path */
	curveQ: function(x1, y1, x, y, relative) {
		relative = (isArray(x1) ? y1 : relative);
		return this._coords((relative ? 'q' : 'Q'), x1, y1, x, y);
	},

	/* Continue a quadratic Bézier curve.
	   Control point is the reflection of the previous control point.
	   @param  x         (number) x-coordinate of curve end or
	                     (number[][]) x-/y-coordinates of points to draw to
	   @param  y         (number) y-coordinate of curve end (omitted if x is array)
	   @param  relative  (boolean) true for coordinates relative to the current point,
	                     false for coordinates being absolute
	   @return  (SVGPath) this path */
	smoothQ: function(x, y, relative) {
		relative = (isArray(x) ? y : relative);
		return this._coords((relative ? 't' : 'T'), x, y);
	},

	/* Generate a path command with (a list of) coordinates. */
	_coords: function(cmd, x1, y1, x2, y2, x3, y3) {
		if (isArray(x1)) {
			for (var i = 0; i < x1.length; i++) {
				var cs = x1[i];
				this._path += (i == 0 ? cmd : ' ') + cs[0] + ',' + cs[1] +
					(cs.length < 4 ? '' : ' ' + cs[2] + ',' + cs[3] +
					(cs.length < 6 ? '': ' ' + cs[4] + ',' + cs[5]));
			}
		}
		else {
			this._path += cmd + x1 + ',' + y1 + 
				(x2 == null ? '' : ' ' + x2 + ',' + y2 +
				(x3 == null ? '' : ' ' + x3 + ',' + y3));
		}
		return this;
	},

	/* Draw an arc to a position.
	   @param  rx         (number) x-radius of arc or
	                      (number/boolean[][]) x-/y-coordinates and flags for points to draw to
	   @param  ry         (number) y-radius of arc (omitted if rx is array)
	   @param  xRotate    (number) x-axis rotation (degrees, clockwise) (omitted if rx is array)
	   @param  large      (boolean) true to draw the large part of the arc,
	                      false to draw the small part (omitted if rx is array)
	   @param  clockwise  (boolean) true to draw the clockwise arc,
	                      false to draw the anti-clockwise arc (omitted if rx is array)
	   @param  x          (number) x-coordinate of arc end (omitted if rx is array)
	   @param  y          (number) y-coordinate of arc end (omitted if rx is array)
	   @param  relative   (boolean) true for coordinates relative to the current point,
	                      false for coordinates being absolute
	   @return  (SVGPath) this path */
	arc: function(rx, ry, xRotate, large, clockwise, x, y, relative) {
		relative = (isArray(rx) ? ry : relative);
		this._path += (relative ? 'a' : 'A');
		if (isArray(rx)) {
			for (var i = 0; i < rx.length; i++) {
				var cs = rx[i];
				this._path += (i == 0 ? '' : ' ') + cs[0] + ',' + cs[1] + ' ' +
					cs[2] + ' ' + (cs[3] ? '1' : '0') + ',' +
					(cs[4] ? '1' : '0') + ' ' + cs[5] + ',' + cs[6];
			}
		}
		else {
			this._path += rx + ',' + ry + ' ' + xRotate + ' ' +
				(large ? '1' : '0') + ',' + (clockwise ? '1' : '0') + ' ' + x + ',' + y;
		}
		return this;
	},

	/* Close the current path.
	   @return  (SVGPath) this path */
	close: function() {
		this._path += 'z';
		return this;
	},

	/* Return the string rendering of the specified path.
	   @return  (string) stringified path */
	path: function() {
		return this._path;
	}
});

SVGPath.prototype.moveTo = SVGPath.prototype.move;
SVGPath.prototype.lineTo = SVGPath.prototype.line;
SVGPath.prototype.horizTo = SVGPath.prototype.horiz;
SVGPath.prototype.vertTo = SVGPath.prototype.vert;
SVGPath.prototype.curveCTo = SVGPath.prototype.curveC;
SVGPath.prototype.smoothCTo = SVGPath.prototype.smoothC;
SVGPath.prototype.curveQTo = SVGPath.prototype.curveQ;
SVGPath.prototype.smoothQTo = SVGPath.prototype.smoothQ;
SVGPath.prototype.arcTo = SVGPath.prototype.arc;

/* Helper to generate an SVG text object.
   Obtain an instance from the SVGWrapper object.
   String calls together to generate the text and use its value:
   var text = root.createText();
   root.text(null, x, y, text.string('This is ').
     span('red', {fill: 'red'}).string('!'), {fill: 'blue'}); */
function SVGText() {
	this._parts = []; // The components of the text object
}

$.extend(SVGText.prototype, {
	/* Prepare to create a new text object.
	   @return  (SVGText) this text */
	reset: function() {
		this._parts = [];
		return this;
	},

	/* Add a straight string value.
	   @param  value  (string) the actual text
	   @return  (SVGText) this text object */
	string: function(value) {
		this._parts[this._parts.length] = ['text', value];
		return this;
	},

	/* Add a separate text span that has its own settings.
	   @param  value     (string) the actual text
	   @param  settings  (object) the settings for this text
	   @return  (SVGText) this text object */
	span: function(value, settings) {
		this._parts[this._parts.length] = ['tspan', value, settings];
		return this;
	},

	/* Add a reference to a previously defined text string.
	   @param  id        (string) the ID of the actual text
	   @param  settings  (object) the settings for this text
	   @return  (SVGText) this text object */
	ref: function(id, settings) {
		this._parts[this._parts.length] = ['tref', id, settings];
		return this;
	},

	/* Add text drawn along a path.
	   @param  id        (string) the ID of the path
	   @param  value     (string) the actual text
	   @param  settings  (object) the settings for this text
	   @return  (SVGText) this text object */
	path: function(id, value, settings) {
		this._parts[this._parts.length] = ['textpath', value, 
			$.extend({href: id}, settings || {})];
		return this;
	}
});

/* Attach the SVG functionality to a jQuery selection.
   @param  command  (string) the command to run (optional, default 'attach')
   @param  options  (object) the new settings to use for these SVG instances
   @return jQuery (object) for chaining further calls */
$.fn.svg = function(options) {
	var otherArgs = Array.prototype.slice.call(arguments, 1);
	if (typeof options == 'string' && options == 'get') {
		return $.svg['_' + options + 'SVG'].apply($.svg, [this[0]].concat(otherArgs));
	}
	return this.each(function() {
		if (typeof options == 'string') {
			$.svg['_' + options + 'SVG'].apply($.svg, [this].concat(otherArgs));
		}
		else {
			$.svg._attachSVG(this, options || {});
		} 
	});
};

/* Determine whether an object is an array. */
function isArray(a) {
	return (a && a.constructor == Array);
}

// Singleton primary SVG interface
$.svg = new SVGManager();

})(jQuery);

/*****
*
*   The contents of this file were written by Kevin Lindsey
*   copyright 2002 Kevin Lindsey
*
*   This file was compacted by jscompact
*   A Perl utility written by Kevin Lindsey (kevin@kevlindev.com)
*
*****/

Array.prototype.foreach=function(func){for(var i=0;i<this.length;i++)func(this[i]);};
Array.prototype.map=function(func){var result=new Array();for(var i=0;i<this.length;i++)result.push(func(this[i]));return result;};
Array.prototype.min=function(){var min=this[0];for(var i=0;i<this.length;i++)if(this[i]<min)min=this[i];return min;}
Array.prototype.max=function(){var max=this[0];for(var i=0;i<this.length;i++)if(this[i]>max)max=this[i];return max;}
AntiZoomAndPan.VERSION="1.2"
function AntiZoomAndPan(){this.init();}
AntiZoomAndPan.prototype.init=function(){var svgRoot=svgDocument.documentElement;this.svgNodes=new Array();this.x_trans=0;this.y_trans=0;this.scale=1;this.lastTM=svgRoot.createSVGMatrix();svgRoot.addEventListener('SVGZoom',this,false);svgRoot.addEventListener('SVGScroll',this,false);svgRoot.addEventListener('SVGResize',this,false);};
AntiZoomAndPan.prototype.appendNode=function(svgNode){this.svgNodes.push(svgNode);};
AntiZoomAndPan.prototype.removeNode=function(svgNode){for(var i=0;i<this.svgNodes.length;i++){if(this.svgNodes[i]===svgNode){this.svgNodes.splice(i,1);break;}}};
AntiZoomAndPan.prototype.handleEvent=function(e){var type=e.type;if(this[type]==null)throw new Error("Unsupported event type: "+type);this[type](e);};
AntiZoomAndPan.prototype.SVGZoom=function(e){this.update();};
AntiZoomAndPan.prototype.SVGScroll=function(e){this.update();};
AntiZoomAndPan.prototype.SVGResize=function(e){this.update();};
AntiZoomAndPan.prototype.update=function(){if(this.svgNodes.length>0){var svgRoot=svgDocument.documentElement;var viewbox=(window.ViewBox!=null)?new ViewBox(svgRoot):null;var matrix=(viewbox!=null)?viewbox.getTM():svgRoot.createSVGMatrix();var trans=svgRoot.currentTranslate;matrix=matrix.scale(1.0/svgRoot.currentScale);matrix=matrix.translate(-trans.x,-trans.y);for(var i=0;i<this.svgNodes.length;i++){var node=this.svgNodes[i];var CTM=matrix.multiply(this.lastTM.multiply(node.getCTM()));var transform="matrix("+[CTM.a,CTM.b,CTM.c,CTM.d,CTM.e,CTM.f].join(",")+")";this.svgNodes[i].setAttributeNS(null,"transform",transform);}this.lastTM=matrix.inverse();}};
EventHandler.VERSION=1.0;
function EventHandler(){this.init();};
EventHandler.prototype.init=function(){};
EventHandler.prototype.handleEvent=function(e){if(this[e.type]==null)throw new Error("Unsupported event type: "+e.type);this[e.type](e);};var svgns="http://www.w3.org/2000/svg";
Mouser.prototype=new EventHandler();
Mouser.prototype.constructor=Mouser;
Mouser.superclass=EventHandler.prototype;
function Mouser(){this.init();}
Mouser.prototype.init=function(){this.svgNode=null;this.handles=new Array();this.shapes=new Array();this.lastPoint=null;this.currentNode=null;this.realize();};
Mouser.prototype.realize=function(){if(this.svgNode==null){var rect=svgDocument.createElementNS(svgns,"rect");this.svgNode=rect;rect.setAttributeNS(null,"x","-32767");rect.setAttributeNS(null,"y","-32767");rect.setAttributeNS(null,"width","65535");rect.setAttributeNS(null,"height","65535");rect.setAttributeNS(null,"fill","none");rect.setAttributeNS(null,"pointer-events","all");rect.setAttributeNS(null,"display","none");svgDocument.documentElement.appendChild(rect);}};
Mouser.prototype.register=function(handle){if(this.handleIndex(handle)==-1){var owner=handle.owner;handle.select(true);this.handles.push(handle);if(owner!=null&&this.shapeIndex(owner)==-1)this.shapes.push(owner);}};
Mouser.prototype.unregister=function(handle){var index=this.handleIndex(handle);if(index!=-1){handle.select(false);this.handles.splice(index,1);}};
Mouser.prototype.registerShape=function(shape){if(this.shapeIndex(shape)==-1){shape.select(true);this.shapes.push(shape);}};
Mouser.prototype.unregisterShape=function(shape){var index=this.shapeIndex(shape);if(index!=-1){shape.select(false);shape.selectHandles(false);shape.showHandles(false);shape.unregisterHandles();this.shapes.splice(index,1);}};
Mouser.prototype.unregisterAll=function(){for(var i=0;i<this.handles.length;i++){this.handles[i].select(false);}this.handles=new Array();};
Mouser.prototype.unregisterShapes=function(){for(var i=0;i<this.shapes.length;i++){var shape=this.shapes[i];shape.select(false);shape.selectHandles(false);shape.showHandles(false);shape.unregisterHandles();}this.shapes=new Array();};
Mouser.prototype.handleIndex=function(handle){var result=-1;for(var i=0;i<this.handles.length;i++){if(this.handles[i]===handle){result=i;break;}}return result;};
Mouser.prototype.shapeIndex=function(shape){var result=-1;for(var i=0;i<this.shapes.length;i++){if(this.shapes[i]===shape){result=i;break;}}return result;};
Mouser.prototype.beginDrag=function(e){this.currentNode=e.target;var svgPoint=this.getUserCoordinate(this.currentNode,e.clientX,e.clientY);this.lastPoint=new Point2D(svgPoint.x,svgPoint.y);this.svgNode.addEventListener("mouseup",this,false);this.svgNode.addEventListener("mousemove",this,false);svgDocument.documentElement.appendChild(this.svgNode);this.svgNode.setAttributeNS(null,"display","inline");};
Mouser.prototype.mouseup=function(e){this.lastPoint=null;this.currentNode=null;this.svgNode.removeEventListener("mouseup",this,false);this.svgNode.removeEventListener("mousemove",this,false);this.svgNode.setAttributeNS(null,"display","none");};
Mouser.prototype.mousemove=function(e){var svgPoint=this.getUserCoordinate(this.currentNode,e.clientX,e.clientY);var newPoint=new Point2D(svgPoint.x,svgPoint.y);var delta=newPoint.subtract(this.lastPoint);var updates=new Array();var updateId=new Date().getTime();this.lastPoint.setFromPoint(newPoint);for(var i=0;i<this.handles.length;i++){var handle=this.handles[i];var owner=handle.owner;handle.translate(delta);if(owner!=null){if(owner.lastUpdate!=updateId){owner.lastUpdate=updateId;updates.push(owner);}}else{updates.push(handle);}}for(var i=0;i<updates.length;i++){updates[i].update();}};
Mouser.prototype.getUserCoordinate=function(node,x,y){var svgRoot=svgDocument.documentElement;var pan=svgRoot.getCurrentTranslate();var zoom=svgRoot.getCurrentScale();var CTM=this.getTransformToElement(node);var iCTM=CTM.inverse();var worldPoint=svgDocument.documentElement.createSVGPoint();worldPoint.x=(x-pan.x)/zoom;worldPoint.y=(y-pan.y)/zoom;return worldPoint.matrixTransform(iCTM);};
Mouser.prototype.getTransformToElement=function(node){var CTM=node.getCTM();while((node=node.parentNode)!=svgDocument){CTM=node.getCTM().multiply(CTM);}return CTM;};
ViewBox.VERSION="1.0";
function ViewBox(svgNode){if(arguments.length>0){this.init(svgNode);}}
ViewBox.prototype.init=function(svgNode){var viewBox=svgNode.getAttributeNS(null,"viewBox");var preserveAspectRatio=svgNode.getAttributeNS(null,"preserveAspectRatio");if(viewBox!=""){var params=viewBox.split(/\s*,\s*|\s+/);this.x=parseFloat(params[0]);this.y=parseFloat(params[1]);this.width=parseFloat(params[2]);this.height=parseFloat(params[3]);}else{this.x=0;this.y=0;this.width=innerWidth;this.height=innerHeight;}this.setPAR(preserveAspectRatio);};
ViewBox.prototype.getTM=function(){var svgRoot=svgDocument.documentElement;var matrix=svgDocument.documentElement.createSVGMatrix();var windowWidth=svgRoot.getAttributeNS(null,"width");var windowHeight=svgRoot.getAttributeNS(null,"height");windowWidth=(windowWidth!="")?parseFloat(windowWidth):innerWidth;windowHeight=(windowHeight!="")?parseFloat(windowHeight):innerHeight;var x_ratio=this.width/windowWidth;var y_ratio=this.height/windowHeight;matrix=matrix.translate(this.x,this.y);if(this.alignX=="none"){matrix=matrix.scaleNonUniform(x_ratio,y_ratio);}else{if(x_ratio<y_ratio&&this.meetOrSlice=="meet"||x_ratio>y_ratio&&this.meetOrSlice=="slice"){var x_trans=0;var x_diff=windowWidth*y_ratio-this.width;if(this.alignX=="Mid")x_trans=-x_diff/2;else if(this.alignX=="Max")x_trans=-x_diff;matrix=matrix.translate(x_trans,0);matrix=matrix.scale(y_ratio);}else if(x_ratio>y_ratio&&this.meetOrSlice=="meet"||x_ratio<y_ratio&&this.meetOrSlice=="slice"){var y_trans=0;var y_diff=windowHeight*x_ratio-this.height;if(this.alignY=="Mid")y_trans=-y_diff/2;else if(this.alignY=="Max")y_trans=-y_diff;matrix=matrix.translate(0,y_trans);matrix=matrix.scale(x_ratio);}else{matrix=matrix.scale(x_ratio);}}return matrix;}
ViewBox.prototype.setPAR=function(PAR){if(PAR){var params=PAR.split(/\s+/);var align=params[0];if(align=="none"){this.alignX="none";this.alignY="none";}else{this.alignX=align.substring(1,4);this.alignY=align.substring(5,9);}if(params.length==2){this.meetOrSlice=params[1];}else{this.meetOrSlice="meet";}}else{this.align="xMidYMid";this.alignX="Mid";this.alignY="Mid";this.meetOrSlice="meet";}};
function Intersection(status){if(arguments.length>0){this.init(status);}}
Intersection.prototype.init=function(status){this.status=status;this.points=new Array();};
Intersection.prototype.appendPoint=function(point){this.points.push(point);};
Intersection.prototype.appendPoints=function(points){this.points=this.points.concat(points);};
Intersection.intersectShapes=function(shape1,shape2){var ip1=shape1.getIntersectionParams();var ip2=shape2.getIntersectionParams();var result;if(ip1!=null&&ip2!=null){if(ip1.name=="Path"){result=Intersection.intersectPathShape(shape1,shape2);}else if(ip2.name=="Path"){result=Intersection.intersectPathShape(shape2,shape1);}else{var method;var params;if(ip1.name<ip2.name){method="intersect"+ip1.name+ip2.name;params=ip1.params.concat(ip2.params);}else{method="intersect"+ip2.name+ip1.name;params=ip2.params.concat(ip1.params);}if(!(method in Intersection))throw new Error("Intersection not available: "+method);result=Intersection[method].apply(null,params);}}else{result=new Intersection("No Intersection");}return result;};
Intersection.intersectPathShape=function(path,shape){return path.intersectShape(shape);};
Intersection.intersectBezier2Bezier2=function(a1,a2,a3,b1,b2,b3){var a,b;var c12,c11,c10;var c22,c21,c20;var TOLERANCE=1e-4;var result=new Intersection("No Intersection");a=a2.multiply(-2);c12=a1.add(a.add(a3));a=a1.multiply(-2);b=a2.multiply(2);c11=a.add(b);c10=new Point2D(a1.x,a1.y);a=b2.multiply(-2);c22=b1.add(a.add(b3));a=b1.multiply(-2);b=b2.multiply(2);c21=a.add(b);c20=new Point2D(b1.x,b1.y);var a=c12.x*c11.y-c11.x*c12.y;var b=c22.x*c11.y-c11.x*c22.y;var c=c21.x*c11.y-c11.x*c21.y;var d=c11.x*(c10.y-c20.y)+c11.y*(-c10.x+c20.x);var e=c22.x*c12.y-c12.x*c22.y;var f=c21.x*c12.y-c12.x*c21.y;var g=c12.x*(c10.y-c20.y)+c12.y*(-c10.x+c20.x);var poly=new Polynomial(-e*e,-2*e*f,a*b-f*f-2*e*g,a*c-2*f*g,a*d-g*g);var roots=poly.getRoots();for(var i=0;i<roots.length;i++){var s=roots[i];if(0<=s&&s<=1){var xRoots=new Polynomial(-c12.x,-c11.x,-c10.x+c20.x+s*c21.x+s*s*c22.x).getRoots();var yRoots=new Polynomial(-c12.y,-c11.y,-c10.y+c20.y+s*c21.y+s*s*c22.y).getRoots();if(xRoots.length>0&&yRoots.length>0){checkRoots:for(var j=0;j<xRoots.length;j++){var xRoot=xRoots[j];if(0<=xRoot&&xRoot<=1){for(var k=0;k<yRoots.length;k++){if(Math.abs(xRoot-yRoots[k])<TOLERANCE){result.points.push(c22.multiply(s*s).add(c21.multiply(s).add(c20)));break checkRoots;}}}}}}}return result;};
Intersection.intersectBezier2Bezier3=function(a1,a2,a3,b1,b2,b3,b4){var a,b,c,d;var c12,c11,c10;var c23,c22,c21,c20;var result=new Intersection("No Intersection");a=a2.multiply(-2);c12=a1.add(a.add(a3));a=a1.multiply(-2);b=a2.multiply(2);c11=a.add(b);c10=new Point2D(a1.x,a1.y);a=b1.multiply(-1);b=b2.multiply(3);c=b3.multiply(-3);d=a.add(b.add(c.add(b4)));c23=new Vector2D(d.x,d.y);a=b1.multiply(3);b=b2.multiply(-6);c=b3.multiply(3);d=a.add(b.add(c));c22=new Vector2D(d.x,d.y);a=b1.multiply(-3);b=b2.multiply(3);c=a.add(b);c21=new Vector2D(c.x,c.y);c20=new Vector2D(b1.x,b1.y);var c10x2=c10.x*c10.x;var c10y2=c10.y*c10.y;var c11x2=c11.x*c11.x;var c11y2=c11.y*c11.y;var c12x2=c12.x*c12.x;var c12y2=c12.y*c12.y;var c20x2=c20.x*c20.x;var c20y2=c20.y*c20.y;var c21x2=c21.x*c21.x;var c21y2=c21.y*c21.y;var c22x2=c22.x*c22.x;var c22y2=c22.y*c22.y;var c23x2=c23.x*c23.x;var c23y2=c23.y*c23.y;var poly=new Polynomial(-2*c12.x*c12.y*c23.x*c23.y+c12x2*c23y2+c12y2*c23x2,-2*c12.x*c12.y*c22.x*c23.y-2*c12.x*c12.y*c22.y*c23.x+2*c12y2*c22.x*c23.x+2*c12x2*c22.y*c23.y,-2*c12.x*c21.x*c12.y*c23.y-2*c12.x*c12.y*c21.y*c23.x-2*c12.x*c12.y*c22.x*c22.y+2*c21.x*c12y2*c23.x+c12y2*c22x2+c12x2*(2*c21.y*c23.y+c22y2),2*c10.x*c12.x*c12.y*c23.y+2*c10.y*c12.x*c12.y*c23.x+c11.x*c11.y*c12.x*c23.y+c11.x*c11.y*c12.y*c23.x-2*c20.x*c12.x*c12.y*c23.y-2*c12.x*c20.y*c12.y*c23.x-2*c12.x*c21.x*c12.y*c22.y-2*c12.x*c12.y*c21.y*c22.x-2*c10.x*c12y2*c23.x-2*c10.y*c12x2*c23.y+2*c20.x*c12y2*c23.x+2*c21.x*c12y2*c22.x-c11y2*c12.x*c23.x-c11x2*c12.y*c23.y+c12x2*(2*c20.y*c23.y+2*c21.y*c22.y),2*c10.x*c12.x*c12.y*c22.y+2*c10.y*c12.x*c12.y*c22.x+c11.x*c11.y*c12.x*c22.y+c11.x*c11.y*c12.y*c22.x-2*c20.x*c12.x*c12.y*c22.y-2*c12.x*c20.y*c12.y*c22.x-2*c12.x*c21.x*c12.y*c21.y-2*c10.x*c12y2*c22.x-2*c10.y*c12x2*c22.y+2*c20.x*c12y2*c22.x-c11y2*c12.x*c22.x-c11x2*c12.y*c22.y+c21x2*c12y2+c12x2*(2*c20.y*c22.y+c21y2),2*c10.x*c12.x*c12.y*c21.y+2*c10.y*c12.x*c21.x*c12.y+c11.x*c11.y*c12.x*c21.y+c11.x*c11.y*c21.x*c12.y-2*c20.x*c12.x*c12.y*c21.y-2*c12.x*c20.y*c21.x*c12.y-2*c10.x*c21.x*c12y2-2*c10.y*c12x2*c21.y+2*c20.x*c21.x*c12y2-c11y2*c12.x*c21.x-c11x2*c12.y*c21.y+2*c12x2*c20.y*c21.y,-2*c10.x*c10.y*c12.x*c12.y-c10.x*c11.x*c11.y*c12.y-c10.y*c11.x*c11.y*c12.x+2*c10.x*c12.x*c20.y*c12.y+2*c10.y*c20.x*c12.x*c12.y+c11.x*c20.x*c11.y*c12.y+c11.x*c11.y*c12.x*c20.y-2*c20.x*c12.x*c20.y*c12.y-2*c10.x*c20.x*c12y2+c10.x*c11y2*c12.x+c10.y*c11x2*c12.y-2*c10.y*c12x2*c20.y-c20.x*c11y2*c12.x-c11x2*c20.y*c12.y+c10x2*c12y2+c10y2*c12x2+c20x2*c12y2+c12x2*c20y2);var roots=poly.getRootsInInterval(0,1);for(var i=0;i<roots.length;i++){var s=roots[i];var xRoots=new Polynomial(c12.x,c11.x,c10.x-c20.x-s*c21.x-s*s*c22.x-s*s*s*c23.x).getRoots();var yRoots=new Polynomial(c12.y,c11.y,c10.y-c20.y-s*c21.y-s*s*c22.y-s*s*s*c23.y).getRoots();if(xRoots.length>0&&yRoots.length>0){var TOLERANCE=1e-4;checkRoots:for(var j=0;j<xRoots.length;j++){var xRoot=xRoots[j];if(0<=xRoot&&xRoot<=1){for(var k=0;k<yRoots.length;k++){if(Math.abs(xRoot-yRoots[k])<TOLERANCE){result.points.push(c23.multiply(s*s*s).add(c22.multiply(s*s).add(c21.multiply(s).add(c20))));break checkRoots;}}}}}}if(result.points.length>0)result.status="Intersection";return result;};
Intersection.intersectBezier2Circle=function(p1,p2,p3,c,r){return Intersection.intersectBezier2Ellipse(p1,p2,p3,c,r,r);};
Intersection.intersectBezier2Ellipse=function(p1,p2,p3,ec,rx,ry){var a,b;var c2,c1,c0;var result=new Intersection("No Intersection");a=p2.multiply(-2);c2=p1.add(a.add(p3));a=p1.multiply(-2);b=p2.multiply(2);c1=a.add(b);c0=new Point2D(p1.x,p1.y);var rxrx=rx*rx;var ryry=ry*ry;var roots=new Polynomial(ryry*c2.x*c2.x+rxrx*c2.y*c2.y,2*(ryry*c2.x*c1.x+rxrx*c2.y*c1.y),ryry*(2*c2.x*c0.x+c1.x*c1.x)+rxrx*(2*c2.y*c0.y+c1.y*c1.y)-2*(ryry*ec.x*c2.x+rxrx*ec.y*c2.y),2*(ryry*c1.x*(c0.x-ec.x)+rxrx*c1.y*(c0.y-ec.y)),ryry*(c0.x*c0.x+ec.x*ec.x)+rxrx*(c0.y*c0.y+ec.y*ec.y)-2*(ryry*ec.x*c0.x+rxrx*ec.y*c0.y)-rxrx*ryry).getRoots();for(var i=0;i<roots.length;i++){var t=roots[i];if(0<=t&&t<=1)result.points.push(c2.multiply(t*t).add(c1.multiply(t).add(c0)));}if(result.points.length>0)result.status="Intersection";return result;};
Intersection.intersectBezier2Line=function(p1,p2,p3,a1,a2){var a,b;var c2,c1,c0;var cl;var n;var min=a1.min(a2);var max=a1.max(a2);var result=new Intersection("No Intersection");a=p2.multiply(-2);c2=p1.add(a.add(p3));a=p1.multiply(-2);b=p2.multiply(2);c1=a.add(b);c0=new Point2D(p1.x,p1.y);n=new Vector2D(a1.y-a2.y,a2.x-a1.x);cl=a1.x*a2.y-a2.x*a1.y;roots=new Polynomial(n.dot(c2),n.dot(c1),n.dot(c0)+cl).getRoots();for(var i=0;i<roots.length;i++){var t=roots[i];if(0<=t&&t<=1){var p4=p1.lerp(p2,t);var p5=p2.lerp(p3,t);var p6=p4.lerp(p5,t);if(a1.x==a2.x){if(min.y<=p6.y&&p6.y<=max.y){result.status="Intersection";result.appendPoint(p6);}}else if(a1.y==a2.y){if(min.x<=p6.x&&p6.x<=max.x){result.status="Intersection";result.appendPoint(p6);}}else if(p6.gte(min)&&p6.lte(max)){result.status="Intersection";result.appendPoint(p6);}}}return result;};
Intersection.intersectBezier2Polygon=function(p1,p2,p3,points){var result=new Intersection("No Intersection");var length=points.length;for(var i=0;i<length;i++){var a1=points[i];var a2=points[(i+1)%length];var inter=Intersection.intersectBezier2Line(p1,p2,p3,a1,a2);result.appendPoints(inter.points);}if(result.points.length>0)result.status="Intersection";return result;};
Intersection.intersectBezier2Rectangle=function(p1,p2,p3,r1,r2){var min=r1.min(r2);var max=r1.max(r2);var topRight=new Point2D(max.x,min.y);var bottomLeft=new Point2D(min.x,max.y);var inter1=Intersection.intersectBezier2Line(p1,p2,p3,min,topRight);var inter2=Intersection.intersectBezier2Line(p1,p2,p3,topRight,max);var inter3=Intersection.intersectBezier2Line(p1,p2,p3,max,bottomLeft);var inter4=Intersection.intersectBezier2Line(p1,p2,p3,bottomLeft,min);var result=new Intersection("No Intersection");result.appendPoints(inter1.points);result.appendPoints(inter2.points);result.appendPoints(inter3.points);result.appendPoints(inter4.points);if(result.points.length>0)result.status="Intersection";return result;};
Intersection.intersectBezier3Bezier3=function(a1,a2,a3,a4,b1,b2,b3,b4){var a,b,c,d;var c13,c12,c11,c10;var c23,c22,c21,c20;var result=new Intersection("No Intersection");a=a1.multiply(-1);b=a2.multiply(3);c=a3.multiply(-3);d=a.add(b.add(c.add(a4)));c13=new Vector2D(d.x,d.y);a=a1.multiply(3);b=a2.multiply(-6);c=a3.multiply(3);d=a.add(b.add(c));c12=new Vector2D(d.x,d.y);a=a1.multiply(-3);b=a2.multiply(3);c=a.add(b);c11=new Vector2D(c.x,c.y);c10=new Vector2D(a1.x,a1.y);a=b1.multiply(-1);b=b2.multiply(3);c=b3.multiply(-3);d=a.add(b.add(c.add(b4)));c23=new Vector2D(d.x,d.y);a=b1.multiply(3);b=b2.multiply(-6);c=b3.multiply(3);d=a.add(b.add(c));c22=new Vector2D(d.x,d.y);a=b1.multiply(-3);b=b2.multiply(3);c=a.add(b);c21=new Vector2D(c.x,c.y);c20=new Vector2D(b1.x,b1.y);var c10x2=c10.x*c10.x;var c10x3=c10.x*c10.x*c10.x;var c10y2=c10.y*c10.y;var c10y3=c10.y*c10.y*c10.y;var c11x2=c11.x*c11.x;var c11x3=c11.x*c11.x*c11.x;var c11y2=c11.y*c11.y;var c11y3=c11.y*c11.y*c11.y;var c12x2=c12.x*c12.x;var c12x3=c12.x*c12.x*c12.x;var c12y2=c12.y*c12.y;var c12y3=c12.y*c12.y*c12.y;var c13x2=c13.x*c13.x;var c13x3=c13.x*c13.x*c13.x;var c13y2=c13.y*c13.y;var c13y3=c13.y*c13.y*c13.y;var c20x2=c20.x*c20.x;var c20x3=c20.x*c20.x*c20.x;var c20y2=c20.y*c20.y;var c20y3=c20.y*c20.y*c20.y;var c21x2=c21.x*c21.x;var c21x3=c21.x*c21.x*c21.x;var c21y2=c21.y*c21.y;var c22x2=c22.x*c22.x;var c22x3=c22.x*c22.x*c22.x;var c22y2=c22.y*c22.y;var c23x2=c23.x*c23.x;var c23x3=c23.x*c23.x*c23.x;var c23y2=c23.y*c23.y;var c23y3=c23.y*c23.y*c23.y;var poly=new Polynomial(-c13x3*c23y3+c13y3*c23x3-3*c13.x*c13y2*c23x2*c23.y+3*c13x2*c13.y*c23.x*c23y2,-6*c13.x*c22.x*c13y2*c23.x*c23.y+6*c13x2*c13.y*c22.y*c23.x*c23.y+3*c22.x*c13y3*c23x2-3*c13x3*c22.y*c23y2-3*c13.x*c13y2*c22.y*c23x2+3*c13x2*c22.x*c13.y*c23y2,-6*c21.x*c13.x*c13y2*c23.x*c23.y-6*c13.x*c22.x*c13y2*c22.y*c23.x+6*c13x2*c22.x*c13.y*c22.y*c23.y+3*c21.x*c13y3*c23x2+3*c22x2*c13y3*c23.x+3*c21.x*c13x2*c13.y*c23y2-3*c13.x*c21.y*c13y2*c23x2-3*c13.x*c22x2*c13y2*c23.y+c13x2*c13.y*c23.x*(6*c21.y*c23.y+3*c22y2)+c13x3*(-c21.y*c23y2-2*c22y2*c23.y-c23.y*(2*c21.y*c23.y+c22y2)),c11.x*c12.y*c13.x*c13.y*c23.x*c23.y-c11.y*c12.x*c13.x*c13.y*c23.x*c23.y+6*c21.x*c22.x*c13y3*c23.x+3*c11.x*c12.x*c13.x*c13.y*c23y2+6*c10.x*c13.x*c13y2*c23.x*c23.y-3*c11.x*c12.x*c13y2*c23.x*c23.y-3*c11.y*c12.y*c13.x*c13.y*c23x2-6*c10.y*c13x2*c13.y*c23.x*c23.y-6*c20.x*c13.x*c13y2*c23.x*c23.y+3*c11.y*c12.y*c13x2*c23.x*c23.y-2*c12.x*c12y2*c13.x*c23.x*c23.y-6*c21.x*c13.x*c22.x*c13y2*c23.y-6*c21.x*c13.x*c13y2*c22.y*c23.x-6*c13.x*c21.y*c22.x*c13y2*c23.x+6*c21.x*c13x2*c13.y*c22.y*c23.y+2*c12x2*c12.y*c13.y*c23.x*c23.y+c22x3*c13y3-3*c10.x*c13y3*c23x2+3*c10.y*c13x3*c23y2+3*c20.x*c13y3*c23x2+c12y3*c13.x*c23x2-c12x3*c13.y*c23y2-3*c10.x*c13x2*c13.y*c23y2+3*c10.y*c13.x*c13y2*c23x2-2*c11.x*c12.y*c13x2*c23y2+c11.x*c12.y*c13y2*c23x2-c11.y*c12.x*c13x2*c23y2+2*c11.y*c12.x*c13y2*c23x2+3*c20.x*c13x2*c13.y*c23y2-c12.x*c12y2*c13.y*c23x2-3*c20.y*c13.x*c13y2*c23x2+c12x2*c12.y*c13.x*c23y2-3*c13.x*c22x2*c13y2*c22.y+c13x2*c13.y*c23.x*(6*c20.y*c23.y+6*c21.y*c22.y)+c13x2*c22.x*c13.y*(6*c21.y*c23.y+3*c22y2)+c13x3*(-2*c21.y*c22.y*c23.y-c20.y*c23y2-c22.y*(2*c21.y*c23.y+c22y2)-c23.y*(2*c20.y*c23.y+2*c21.y*c22.y)),6*c11.x*c12.x*c13.x*c13.y*c22.y*c23.y+c11.x*c12.y*c13.x*c22.x*c13.y*c23.y+c11.x*c12.y*c13.x*c13.y*c22.y*c23.x-c11.y*c12.x*c13.x*c22.x*c13.y*c23.y-c11.y*c12.x*c13.x*c13.y*c22.y*c23.x-6*c11.y*c12.y*c13.x*c22.x*c13.y*c23.x-6*c10.x*c22.x*c13y3*c23.x+6*c20.x*c22.x*c13y3*c23.x+6*c10.y*c13x3*c22.y*c23.y+2*c12y3*c13.x*c22.x*c23.x-2*c12x3*c13.y*c22.y*c23.y+6*c10.x*c13.x*c22.x*c13y2*c23.y+6*c10.x*c13.x*c13y2*c22.y*c23.x+6*c10.y*c13.x*c22.x*c13y2*c23.x-3*c11.x*c12.x*c22.x*c13y2*c23.y-3*c11.x*c12.x*c13y2*c22.y*c23.x+2*c11.x*c12.y*c22.x*c13y2*c23.x+4*c11.y*c12.x*c22.x*c13y2*c23.x-6*c10.x*c13x2*c13.y*c22.y*c23.y-6*c10.y*c13x2*c22.x*c13.y*c23.y-6*c10.y*c13x2*c13.y*c22.y*c23.x-4*c11.x*c12.y*c13x2*c22.y*c23.y-6*c20.x*c13.x*c22.x*c13y2*c23.y-6*c20.x*c13.x*c13y2*c22.y*c23.x-2*c11.y*c12.x*c13x2*c22.y*c23.y+3*c11.y*c12.y*c13x2*c22.x*c23.y+3*c11.y*c12.y*c13x2*c22.y*c23.x-2*c12.x*c12y2*c13.x*c22.x*c23.y-2*c12.x*c12y2*c13.x*c22.y*c23.x-2*c12.x*c12y2*c22.x*c13.y*c23.x-6*c20.y*c13.x*c22.x*c13y2*c23.x-6*c21.x*c13.x*c21.y*c13y2*c23.x-6*c21.x*c13.x*c22.x*c13y2*c22.y+6*c20.x*c13x2*c13.y*c22.y*c23.y+2*c12x2*c12.y*c13.x*c22.y*c23.y+2*c12x2*c12.y*c22.x*c13.y*c23.y+2*c12x2*c12.y*c13.y*c22.y*c23.x+3*c21.x*c22x2*c13y3+3*c21x2*c13y3*c23.x-3*c13.x*c21.y*c22x2*c13y2-3*c21x2*c13.x*c13y2*c23.y+c13x2*c22.x*c13.y*(6*c20.y*c23.y+6*c21.y*c22.y)+c13x2*c13.y*c23.x*(6*c20.y*c22.y+3*c21y2)+c21.x*c13x2*c13.y*(6*c21.y*c23.y+3*c22y2)+c13x3*(-2*c20.y*c22.y*c23.y-c23.y*(2*c20.y*c22.y+c21y2)-c21.y*(2*c21.y*c23.y+c22y2)-c22.y*(2*c20.y*c23.y+2*c21.y*c22.y)),c11.x*c21.x*c12.y*c13.x*c13.y*c23.y+c11.x*c12.y*c13.x*c21.y*c13.y*c23.x+c11.x*c12.y*c13.x*c22.x*c13.y*c22.y-c11.y*c12.x*c21.x*c13.x*c13.y*c23.y-c11.y*c12.x*c13.x*c21.y*c13.y*c23.x-c11.y*c12.x*c13.x*c22.x*c13.y*c22.y-6*c11.y*c21.x*c12.y*c13.x*c13.y*c23.x-6*c10.x*c21.x*c13y3*c23.x+6*c20.x*c21.x*c13y3*c23.x+2*c21.x*c12y3*c13.x*c23.x+6*c10.x*c21.x*c13.x*c13y2*c23.y+6*c10.x*c13.x*c21.y*c13y2*c23.x+6*c10.x*c13.x*c22.x*c13y2*c22.y+6*c10.y*c21.x*c13.x*c13y2*c23.x-3*c11.x*c12.x*c21.x*c13y2*c23.y-3*c11.x*c12.x*c21.y*c13y2*c23.x-3*c11.x*c12.x*c22.x*c13y2*c22.y+2*c11.x*c21.x*c12.y*c13y2*c23.x+4*c11.y*c12.x*c21.x*c13y2*c23.x-6*c10.y*c21.x*c13x2*c13.y*c23.y-6*c10.y*c13x2*c21.y*c13.y*c23.x-6*c10.y*c13x2*c22.x*c13.y*c22.y-6*c20.x*c21.x*c13.x*c13y2*c23.y-6*c20.x*c13.x*c21.y*c13y2*c23.x-6*c20.x*c13.x*c22.x*c13y2*c22.y+3*c11.y*c21.x*c12.y*c13x2*c23.y-3*c11.y*c12.y*c13.x*c22x2*c13.y+3*c11.y*c12.y*c13x2*c21.y*c23.x+3*c11.y*c12.y*c13x2*c22.x*c22.y-2*c12.x*c21.x*c12y2*c13.x*c23.y-2*c12.x*c21.x*c12y2*c13.y*c23.x-2*c12.x*c12y2*c13.x*c21.y*c23.x-2*c12.x*c12y2*c13.x*c22.x*c22.y-6*c20.y*c21.x*c13.x*c13y2*c23.x-6*c21.x*c13.x*c21.y*c22.x*c13y2+6*c20.y*c13x2*c21.y*c13.y*c23.x+2*c12x2*c21.x*c12.y*c13.y*c23.y+2*c12x2*c12.y*c21.y*c13.y*c23.x+2*c12x2*c12.y*c22.x*c13.y*c22.y-3*c10.x*c22x2*c13y3+3*c20.x*c22x2*c13y3+3*c21x2*c22.x*c13y3+c12y3*c13.x*c22x2+3*c10.y*c13.x*c22x2*c13y2+c11.x*c12.y*c22x2*c13y2+2*c11.y*c12.x*c22x2*c13y2-c12.x*c12y2*c22x2*c13.y-3*c20.y*c13.x*c22x2*c13y2-3*c21x2*c13.x*c13y2*c22.y+c12x2*c12.y*c13.x*(2*c21.y*c23.y+c22y2)+c11.x*c12.x*c13.x*c13.y*(6*c21.y*c23.y+3*c22y2)+c21.x*c13x2*c13.y*(6*c20.y*c23.y+6*c21.y*c22.y)+c12x3*c13.y*(-2*c21.y*c23.y-c22y2)+c10.y*c13x3*(6*c21.y*c23.y+3*c22y2)+c11.y*c12.x*c13x2*(-2*c21.y*c23.y-c22y2)+c11.x*c12.y*c13x2*(-4*c21.y*c23.y-2*c22y2)+c10.x*c13x2*c13.y*(-6*c21.y*c23.y-3*c22y2)+c13x2*c22.x*c13.y*(6*c20.y*c22.y+3*c21y2)+c20.x*c13x2*c13.y*(6*c21.y*c23.y+3*c22y2)+c13x3*(-2*c20.y*c21.y*c23.y-c22.y*(2*c20.y*c22.y+c21y2)-c20.y*(2*c21.y*c23.y+c22y2)-c21.y*(2*c20.y*c23.y+2*c21.y*c22.y)),-c10.x*c11.x*c12.y*c13.x*c13.y*c23.y+c10.x*c11.y*c12.x*c13.x*c13.y*c23.y+6*c10.x*c11.y*c12.y*c13.x*c13.y*c23.x-6*c10.y*c11.x*c12.x*c13.x*c13.y*c23.y-c10.y*c11.x*c12.y*c13.x*c13.y*c23.x+c10.y*c11.y*c12.x*c13.x*c13.y*c23.x+c11.x*c11.y*c12.x*c12.y*c13.x*c23.y-c11.x*c11.y*c12.x*c12.y*c13.y*c23.x+c11.x*c20.x*c12.y*c13.x*c13.y*c23.y+c11.x*c20.y*c12.y*c13.x*c13.y*c23.x+c11.x*c21.x*c12.y*c13.x*c13.y*c22.y+c11.x*c12.y*c13.x*c21.y*c22.x*c13.y-c20.x*c11.y*c12.x*c13.x*c13.y*c23.y-6*c20.x*c11.y*c12.y*c13.x*c13.y*c23.x-c11.y*c12.x*c20.y*c13.x*c13.y*c23.x-c11.y*c12.x*c21.x*c13.x*c13.y*c22.y-c11.y*c12.x*c13.x*c21.y*c22.x*c13.y-6*c11.y*c21.x*c12.y*c13.x*c22.x*c13.y-6*c10.x*c20.x*c13y3*c23.x-6*c10.x*c21.x*c22.x*c13y3-2*c10.x*c12y3*c13.x*c23.x+6*c20.x*c21.x*c22.x*c13y3+2*c20.x*c12y3*c13.x*c23.x+2*c21.x*c12y3*c13.x*c22.x+2*c10.y*c12x3*c13.y*c23.y-6*c10.x*c10.y*c13.x*c13y2*c23.x+3*c10.x*c11.x*c12.x*c13y2*c23.y-2*c10.x*c11.x*c12.y*c13y2*c23.x-4*c10.x*c11.y*c12.x*c13y2*c23.x+3*c10.y*c11.x*c12.x*c13y2*c23.x+6*c10.x*c10.y*c13x2*c13.y*c23.y+6*c10.x*c20.x*c13.x*c13y2*c23.y-3*c10.x*c11.y*c12.y*c13x2*c23.y+2*c10.x*c12.x*c12y2*c13.x*c23.y+2*c10.x*c12.x*c12y2*c13.y*c23.x+6*c10.x*c20.y*c13.x*c13y2*c23.x+6*c10.x*c21.x*c13.x*c13y2*c22.y+6*c10.x*c13.x*c21.y*c22.x*c13y2+4*c10.y*c11.x*c12.y*c13x2*c23.y+6*c10.y*c20.x*c13.x*c13y2*c23.x+2*c10.y*c11.y*c12.x*c13x2*c23.y-3*c10.y*c11.y*c12.y*c13x2*c23.x+2*c10.y*c12.x*c12y2*c13.x*c23.x+6*c10.y*c21.x*c13.x*c22.x*c13y2-3*c11.x*c20.x*c12.x*c13y2*c23.y+2*c11.x*c20.x*c12.y*c13y2*c23.x+c11.x*c11.y*c12y2*c13.x*c23.x-3*c11.x*c12.x*c20.y*c13y2*c23.x-3*c11.x*c12.x*c21.x*c13y2*c22.y-3*c11.x*c12.x*c21.y*c22.x*c13y2+2*c11.x*c21.x*c12.y*c22.x*c13y2+4*c20.x*c11.y*c12.x*c13y2*c23.x+4*c11.y*c12.x*c21.x*c22.x*c13y2-2*c10.x*c12x2*c12.y*c13.y*c23.y-6*c10.y*c20.x*c13x2*c13.y*c23.y-6*c10.y*c20.y*c13x2*c13.y*c23.x-6*c10.y*c21.x*c13x2*c13.y*c22.y-2*c10.y*c12x2*c12.y*c13.x*c23.y-2*c10.y*c12x2*c12.y*c13.y*c23.x-6*c10.y*c13x2*c21.y*c22.x*c13.y-c11.x*c11.y*c12x2*c13.y*c23.y-2*c11.x*c11y2*c13.x*c13.y*c23.x+3*c20.x*c11.y*c12.y*c13x2*c23.y-2*c20.x*c12.x*c12y2*c13.x*c23.y-2*c20.x*c12.x*c12y2*c13.y*c23.x-6*c20.x*c20.y*c13.x*c13y2*c23.x-6*c20.x*c21.x*c13.x*c13y2*c22.y-6*c20.x*c13.x*c21.y*c22.x*c13y2+3*c11.y*c20.y*c12.y*c13x2*c23.x+3*c11.y*c21.x*c12.y*c13x2*c22.y+3*c11.y*c12.y*c13x2*c21.y*c22.x-2*c12.x*c20.y*c12y2*c13.x*c23.x-2*c12.x*c21.x*c12y2*c13.x*c22.y-2*c12.x*c21.x*c12y2*c22.x*c13.y-2*c12.x*c12y2*c13.x*c21.y*c22.x-6*c20.y*c21.x*c13.x*c22.x*c13y2-c11y2*c12.x*c12.y*c13.x*c23.x+2*c20.x*c12x2*c12.y*c13.y*c23.y+6*c20.y*c13x2*c21.y*c22.x*c13.y+2*c11x2*c11.y*c13.x*c13.y*c23.y+c11x2*c12.x*c12.y*c13.y*c23.y+2*c12x2*c20.y*c12.y*c13.y*c23.x+2*c12x2*c21.x*c12.y*c13.y*c22.y+2*c12x2*c12.y*c21.y*c22.x*c13.y+c21x3*c13y3+3*c10x2*c13y3*c23.x-3*c10y2*c13x3*c23.y+3*c20x2*c13y3*c23.x+c11y3*c13x2*c23.x-c11x3*c13y2*c23.y-c11.x*c11y2*c13x2*c23.y+c11x2*c11.y*c13y2*c23.x-3*c10x2*c13.x*c13y2*c23.y+3*c10y2*c13x2*c13.y*c23.x-c11x2*c12y2*c13.x*c23.y+c11y2*c12x2*c13.y*c23.x-3*c21x2*c13.x*c21.y*c13y2-3*c20x2*c13.x*c13y2*c23.y+3*c20y2*c13x2*c13.y*c23.x+c11.x*c12.x*c13.x*c13.y*(6*c20.y*c23.y+6*c21.y*c22.y)+c12x3*c13.y*(-2*c20.y*c23.y-2*c21.y*c22.y)+c10.y*c13x3*(6*c20.y*c23.y+6*c21.y*c22.y)+c11.y*c12.x*c13x2*(-2*c20.y*c23.y-2*c21.y*c22.y)+c12x2*c12.y*c13.x*(2*c20.y*c23.y+2*c21.y*c22.y)+c11.x*c12.y*c13x2*(-4*c20.y*c23.y-4*c21.y*c22.y)+c10.x*c13x2*c13.y*(-6*c20.y*c23.y-6*c21.y*c22.y)+c20.x*c13x2*c13.y*(6*c20.y*c23.y+6*c21.y*c22.y)+c21.x*c13x2*c13.y*(6*c20.y*c22.y+3*c21y2)+c13x3*(-2*c20.y*c21.y*c22.y-c20y2*c23.y-c21.y*(2*c20.y*c22.y+c21y2)-c20.y*(2*c20.y*c23.y+2*c21.y*c22.y)),-c10.x*c11.x*c12.y*c13.x*c13.y*c22.y+c10.x*c11.y*c12.x*c13.x*c13.y*c22.y+6*c10.x*c11.y*c12.y*c13.x*c22.x*c13.y-6*c10.y*c11.x*c12.x*c13.x*c13.y*c22.y-c10.y*c11.x*c12.y*c13.x*c22.x*c13.y+c10.y*c11.y*c12.x*c13.x*c22.x*c13.y+c11.x*c11.y*c12.x*c12.y*c13.x*c22.y-c11.x*c11.y*c12.x*c12.y*c22.x*c13.y+c11.x*c20.x*c12.y*c13.x*c13.y*c22.y+c11.x*c20.y*c12.y*c13.x*c22.x*c13.y+c11.x*c21.x*c12.y*c13.x*c21.y*c13.y-c20.x*c11.y*c12.x*c13.x*c13.y*c22.y-6*c20.x*c11.y*c12.y*c13.x*c22.x*c13.y-c11.y*c12.x*c20.y*c13.x*c22.x*c13.y-c11.y*c12.x*c21.x*c13.x*c21.y*c13.y-6*c10.x*c20.x*c22.x*c13y3-2*c10.x*c12y3*c13.x*c22.x+2*c20.x*c12y3*c13.x*c22.x+2*c10.y*c12x3*c13.y*c22.y-6*c10.x*c10.y*c13.x*c22.x*c13y2+3*c10.x*c11.x*c12.x*c13y2*c22.y-2*c10.x*c11.x*c12.y*c22.x*c13y2-4*c10.x*c11.y*c12.x*c22.x*c13y2+3*c10.y*c11.x*c12.x*c22.x*c13y2+6*c10.x*c10.y*c13x2*c13.y*c22.y+6*c10.x*c20.x*c13.x*c13y2*c22.y-3*c10.x*c11.y*c12.y*c13x2*c22.y+2*c10.x*c12.x*c12y2*c13.x*c22.y+2*c10.x*c12.x*c12y2*c22.x*c13.y+6*c10.x*c20.y*c13.x*c22.x*c13y2+6*c10.x*c21.x*c13.x*c21.y*c13y2+4*c10.y*c11.x*c12.y*c13x2*c22.y+6*c10.y*c20.x*c13.x*c22.x*c13y2+2*c10.y*c11.y*c12.x*c13x2*c22.y-3*c10.y*c11.y*c12.y*c13x2*c22.x+2*c10.y*c12.x*c12y2*c13.x*c22.x-3*c11.x*c20.x*c12.x*c13y2*c22.y+2*c11.x*c20.x*c12.y*c22.x*c13y2+c11.x*c11.y*c12y2*c13.x*c22.x-3*c11.x*c12.x*c20.y*c22.x*c13y2-3*c11.x*c12.x*c21.x*c21.y*c13y2+4*c20.x*c11.y*c12.x*c22.x*c13y2-2*c10.x*c12x2*c12.y*c13.y*c22.y-6*c10.y*c20.x*c13x2*c13.y*c22.y-6*c10.y*c20.y*c13x2*c22.x*c13.y-6*c10.y*c21.x*c13x2*c21.y*c13.y-2*c10.y*c12x2*c12.y*c13.x*c22.y-2*c10.y*c12x2*c12.y*c22.x*c13.y-c11.x*c11.y*c12x2*c13.y*c22.y-2*c11.x*c11y2*c13.x*c22.x*c13.y+3*c20.x*c11.y*c12.y*c13x2*c22.y-2*c20.x*c12.x*c12y2*c13.x*c22.y-2*c20.x*c12.x*c12y2*c22.x*c13.y-6*c20.x*c20.y*c13.x*c22.x*c13y2-6*c20.x*c21.x*c13.x*c21.y*c13y2+3*c11.y*c20.y*c12.y*c13x2*c22.x+3*c11.y*c21.x*c12.y*c13x2*c21.y-2*c12.x*c20.y*c12y2*c13.x*c22.x-2*c12.x*c21.x*c12y2*c13.x*c21.y-c11y2*c12.x*c12.y*c13.x*c22.x+2*c20.x*c12x2*c12.y*c13.y*c22.y-3*c11.y*c21x2*c12.y*c13.x*c13.y+6*c20.y*c21.x*c13x2*c21.y*c13.y+2*c11x2*c11.y*c13.x*c13.y*c22.y+c11x2*c12.x*c12.y*c13.y*c22.y+2*c12x2*c20.y*c12.y*c22.x*c13.y+2*c12x2*c21.x*c12.y*c21.y*c13.y-3*c10.x*c21x2*c13y3+3*c20.x*c21x2*c13y3+3*c10x2*c22.x*c13y3-3*c10y2*c13x3*c22.y+3*c20x2*c22.x*c13y3+c21x2*c12y3*c13.x+c11y3*c13x2*c22.x-c11x3*c13y2*c22.y+3*c10.y*c21x2*c13.x*c13y2-c11.x*c11y2*c13x2*c22.y+c11.x*c21x2*c12.y*c13y2+2*c11.y*c12.x*c21x2*c13y2+c11x2*c11.y*c22.x*c13y2-c12.x*c21x2*c12y2*c13.y-3*c20.y*c21x2*c13.x*c13y2-3*c10x2*c13.x*c13y2*c22.y+3*c10y2*c13x2*c22.x*c13.y-c11x2*c12y2*c13.x*c22.y+c11y2*c12x2*c22.x*c13.y-3*c20x2*c13.x*c13y2*c22.y+3*c20y2*c13x2*c22.x*c13.y+c12x2*c12.y*c13.x*(2*c20.y*c22.y+c21y2)+c11.x*c12.x*c13.x*c13.y*(6*c20.y*c22.y+3*c21y2)+c12x3*c13.y*(-2*c20.y*c22.y-c21y2)+c10.y*c13x3*(6*c20.y*c22.y+3*c21y2)+c11.y*c12.x*c13x2*(-2*c20.y*c22.y-c21y2)+c11.x*c12.y*c13x2*(-4*c20.y*c22.y-2*c21y2)+c10.x*c13x2*c13.y*(-6*c20.y*c22.y-3*c21y2)+c20.x*c13x2*c13.y*(6*c20.y*c22.y+3*c21y2)+c13x3*(-2*c20.y*c21y2-c20y2*c22.y-c20.y*(2*c20.y*c22.y+c21y2)),-c10.x*c11.x*c12.y*c13.x*c21.y*c13.y+c10.x*c11.y*c12.x*c13.x*c21.y*c13.y+6*c10.x*c11.y*c21.x*c12.y*c13.x*c13.y-6*c10.y*c11.x*c12.x*c13.x*c21.y*c13.y-c10.y*c11.x*c21.x*c12.y*c13.x*c13.y+c10.y*c11.y*c12.x*c21.x*c13.x*c13.y-c11.x*c11.y*c12.x*c21.x*c12.y*c13.y+c11.x*c11.y*c12.x*c12.y*c13.x*c21.y+c11.x*c20.x*c12.y*c13.x*c21.y*c13.y+6*c11.x*c12.x*c20.y*c13.x*c21.y*c13.y+c11.x*c20.y*c21.x*c12.y*c13.x*c13.y-c20.x*c11.y*c12.x*c13.x*c21.y*c13.y-6*c20.x*c11.y*c21.x*c12.y*c13.x*c13.y-c11.y*c12.x*c20.y*c21.x*c13.x*c13.y-6*c10.x*c20.x*c21.x*c13y3-2*c10.x*c21.x*c12y3*c13.x+6*c10.y*c20.y*c13x3*c21.y+2*c20.x*c21.x*c12y3*c13.x+2*c10.y*c12x3*c21.y*c13.y-2*c12x3*c20.y*c21.y*c13.y-6*c10.x*c10.y*c21.x*c13.x*c13y2+3*c10.x*c11.x*c12.x*c21.y*c13y2-2*c10.x*c11.x*c21.x*c12.y*c13y2-4*c10.x*c11.y*c12.x*c21.x*c13y2+3*c10.y*c11.x*c12.x*c21.x*c13y2+6*c10.x*c10.y*c13x2*c21.y*c13.y+6*c10.x*c20.x*c13.x*c21.y*c13y2-3*c10.x*c11.y*c12.y*c13x2*c21.y+2*c10.x*c12.x*c21.x*c12y2*c13.y+2*c10.x*c12.x*c12y2*c13.x*c21.y+6*c10.x*c20.y*c21.x*c13.x*c13y2+4*c10.y*c11.x*c12.y*c13x2*c21.y+6*c10.y*c20.x*c21.x*c13.x*c13y2+2*c10.y*c11.y*c12.x*c13x2*c21.y-3*c10.y*c11.y*c21.x*c12.y*c13x2+2*c10.y*c12.x*c21.x*c12y2*c13.x-3*c11.x*c20.x*c12.x*c21.y*c13y2+2*c11.x*c20.x*c21.x*c12.y*c13y2+c11.x*c11.y*c21.x*c12y2*c13.x-3*c11.x*c12.x*c20.y*c21.x*c13y2+4*c20.x*c11.y*c12.x*c21.x*c13y2-6*c10.x*c20.y*c13x2*c21.y*c13.y-2*c10.x*c12x2*c12.y*c21.y*c13.y-6*c10.y*c20.x*c13x2*c21.y*c13.y-6*c10.y*c20.y*c21.x*c13x2*c13.y-2*c10.y*c12x2*c21.x*c12.y*c13.y-2*c10.y*c12x2*c12.y*c13.x*c21.y-c11.x*c11.y*c12x2*c21.y*c13.y-4*c11.x*c20.y*c12.y*c13x2*c21.y-2*c11.x*c11y2*c21.x*c13.x*c13.y+3*c20.x*c11.y*c12.y*c13x2*c21.y-2*c20.x*c12.x*c21.x*c12y2*c13.y-2*c20.x*c12.x*c12y2*c13.x*c21.y-6*c20.x*c20.y*c21.x*c13.x*c13y2-2*c11.y*c12.x*c20.y*c13x2*c21.y+3*c11.y*c20.y*c21.x*c12.y*c13x2-2*c12.x*c20.y*c21.x*c12y2*c13.x-c11y2*c12.x*c21.x*c12.y*c13.x+6*c20.x*c20.y*c13x2*c21.y*c13.y+2*c20.x*c12x2*c12.y*c21.y*c13.y+2*c11x2*c11.y*c13.x*c21.y*c13.y+c11x2*c12.x*c12.y*c21.y*c13.y+2*c12x2*c20.y*c21.x*c12.y*c13.y+2*c12x2*c20.y*c12.y*c13.x*c21.y+3*c10x2*c21.x*c13y3-3*c10y2*c13x3*c21.y+3*c20x2*c21.x*c13y3+c11y3*c21.x*c13x2-c11x3*c21.y*c13y2-3*c20y2*c13x3*c21.y-c11.x*c11y2*c13x2*c21.y+c11x2*c11.y*c21.x*c13y2-3*c10x2*c13.x*c21.y*c13y2+3*c10y2*c21.x*c13x2*c13.y-c11x2*c12y2*c13.x*c21.y+c11y2*c12x2*c21.x*c13.y-3*c20x2*c13.x*c21.y*c13y2+3*c20y2*c21.x*c13x2*c13.y,c10.x*c10.y*c11.x*c12.y*c13.x*c13.y-c10.x*c10.y*c11.y*c12.x*c13.x*c13.y+c10.x*c11.x*c11.y*c12.x*c12.y*c13.y-c10.y*c11.x*c11.y*c12.x*c12.y*c13.x-c10.x*c11.x*c20.y*c12.y*c13.x*c13.y+6*c10.x*c20.x*c11.y*c12.y*c13.x*c13.y+c10.x*c11.y*c12.x*c20.y*c13.x*c13.y-c10.y*c11.x*c20.x*c12.y*c13.x*c13.y-6*c10.y*c11.x*c12.x*c20.y*c13.x*c13.y+c10.y*c20.x*c11.y*c12.x*c13.x*c13.y-c11.x*c20.x*c11.y*c12.x*c12.y*c13.y+c11.x*c11.y*c12.x*c20.y*c12.y*c13.x+c11.x*c20.x*c20.y*c12.y*c13.x*c13.y-c20.x*c11.y*c12.x*c20.y*c13.x*c13.y-2*c10.x*c20.x*c12y3*c13.x+2*c10.y*c12x3*c20.y*c13.y-3*c10.x*c10.y*c11.x*c12.x*c13y2-6*c10.x*c10.y*c20.x*c13.x*c13y2+3*c10.x*c10.y*c11.y*c12.y*c13x2-2*c10.x*c10.y*c12.x*c12y2*c13.x-2*c10.x*c11.x*c20.x*c12.y*c13y2-c10.x*c11.x*c11.y*c12y2*c13.x+3*c10.x*c11.x*c12.x*c20.y*c13y2-4*c10.x*c20.x*c11.y*c12.x*c13y2+3*c10.y*c11.x*c20.x*c12.x*c13y2+6*c10.x*c10.y*c20.y*c13x2*c13.y+2*c10.x*c10.y*c12x2*c12.y*c13.y+2*c10.x*c11.x*c11y2*c13.x*c13.y+2*c10.x*c20.x*c12.x*c12y2*c13.y+6*c10.x*c20.x*c20.y*c13.x*c13y2-3*c10.x*c11.y*c20.y*c12.y*c13x2+2*c10.x*c12.x*c20.y*c12y2*c13.x+c10.x*c11y2*c12.x*c12.y*c13.x+c10.y*c11.x*c11.y*c12x2*c13.y+4*c10.y*c11.x*c20.y*c12.y*c13x2-3*c10.y*c20.x*c11.y*c12.y*c13x2+2*c10.y*c20.x*c12.x*c12y2*c13.x+2*c10.y*c11.y*c12.x*c20.y*c13x2+c11.x*c20.x*c11.y*c12y2*c13.x-3*c11.x*c20.x*c12.x*c20.y*c13y2-2*c10.x*c12x2*c20.y*c12.y*c13.y-6*c10.y*c20.x*c20.y*c13x2*c13.y-2*c10.y*c20.x*c12x2*c12.y*c13.y-2*c10.y*c11x2*c11.y*c13.x*c13.y-c10.y*c11x2*c12.x*c12.y*c13.y-2*c10.y*c12x2*c20.y*c12.y*c13.x-2*c11.x*c20.x*c11y2*c13.x*c13.y-c11.x*c11.y*c12x2*c20.y*c13.y+3*c20.x*c11.y*c20.y*c12.y*c13x2-2*c20.x*c12.x*c20.y*c12y2*c13.x-c20.x*c11y2*c12.x*c12.y*c13.x+3*c10y2*c11.x*c12.x*c13.x*c13.y+3*c11.x*c12.x*c20y2*c13.x*c13.y+2*c20.x*c12x2*c20.y*c12.y*c13.y-3*c10x2*c11.y*c12.y*c13.x*c13.y+2*c11x2*c11.y*c20.y*c13.x*c13.y+c11x2*c12.x*c20.y*c12.y*c13.y-3*c20x2*c11.y*c12.y*c13.x*c13.y-c10x3*c13y3+c10y3*c13x3+c20x3*c13y3-c20y3*c13x3-3*c10.x*c20x2*c13y3-c10.x*c11y3*c13x2+3*c10x2*c20.x*c13y3+c10.y*c11x3*c13y2+3*c10.y*c20y2*c13x3+c20.x*c11y3*c13x2+c10x2*c12y3*c13.x-3*c10y2*c20.y*c13x3-c10y2*c12x3*c13.y+c20x2*c12y3*c13.x-c11x3*c20.y*c13y2-c12x3*c20y2*c13.y-c10.x*c11x2*c11.y*c13y2+c10.y*c11.x*c11y2*c13x2-3*c10.x*c10y2*c13x2*c13.y-c10.x*c11y2*c12x2*c13.y+c10.y*c11x2*c12y2*c13.x-c11.x*c11y2*c20.y*c13x2+3*c10x2*c10.y*c13.x*c13y2+c10x2*c11.x*c12.y*c13y2+2*c10x2*c11.y*c12.x*c13y2-2*c10y2*c11.x*c12.y*c13x2-c10y2*c11.y*c12.x*c13x2+c11x2*c20.x*c11.y*c13y2-3*c10.x*c20y2*c13x2*c13.y+3*c10.y*c20x2*c13.x*c13y2+c11.x*c20x2*c12.y*c13y2-2*c11.x*c20y2*c12.y*c13x2+c20.x*c11y2*c12x2*c13.y-c11.y*c12.x*c20y2*c13x2-c10x2*c12.x*c12y2*c13.y-3*c10x2*c20.y*c13.x*c13y2+3*c10y2*c20.x*c13x2*c13.y+c10y2*c12x2*c12.y*c13.x-c11x2*c20.y*c12y2*c13.x+2*c20x2*c11.y*c12.x*c13y2+3*c20.x*c20y2*c13x2*c13.y-c20x2*c12.x*c12y2*c13.y-3*c20x2*c20.y*c13.x*c13y2+c12x2*c20y2*c12.y*c13.x);var roots=poly.getRootsInInterval(0,1);for(var i=0;i<roots.length;i++){var s=roots[i];var xRoots=new Polynomial(c13.x,c12.x,c11.x,c10.x-c20.x-s*c21.x-s*s*c22.x-s*s*s*c23.x).getRoots();var yRoots=new Polynomial(c13.y,c12.y,c11.y,c10.y-c20.y-s*c21.y-s*s*c22.y-s*s*s*c23.y).getRoots();if(xRoots.length>0&&yRoots.length>0){var TOLERANCE=1e-4;checkRoots:for(var j=0;j<xRoots.length;j++){var xRoot=xRoots[j];if(0<=xRoot&&xRoot<=1){for(var k=0;k<yRoots.length;k++){if(Math.abs(xRoot-yRoots[k])<TOLERANCE){result.points.push(c23.multiply(s*s*s).add(c22.multiply(s*s).add(c21.multiply(s).add(c20))));break checkRoots;}}}}}}if(result.points.length>0)result.status="Intersection";return result;};
Intersection.intersectBezier3Circle=function(p1,p2,p3,p4,c,r){return Intersection.intersectBezier3Ellipse(p1,p2,p3,p4,c,r,r);};
Intersection.intersectBezier3Ellipse=function(p1,p2,p3,p4,ec,rx,ry){var a,b,c,d;var c3,c2,c1,c0;var result=new Intersection("No Intersection");a=p1.multiply(-1);b=p2.multiply(3);c=p3.multiply(-3);d=a.add(b.add(c.add(p4)));c3=new Vector2D(d.x,d.y);a=p1.multiply(3);b=p2.multiply(-6);c=p3.multiply(3);d=a.add(b.add(c));c2=new Vector2D(d.x,d.y);a=p1.multiply(-3);b=p2.multiply(3);c=a.add(b);c1=new Vector2D(c.x,c.y);c0=new Vector2D(p1.x,p1.y);var rxrx=rx*rx;var ryry=ry*ry;var poly=new Polynomial(c3.x*c3.x*ryry+c3.y*c3.y*rxrx,2*(c3.x*c2.x*ryry+c3.y*c2.y*rxrx),2*(c3.x*c1.x*ryry+c3.y*c1.y*rxrx)+c2.x*c2.x*ryry+c2.y*c2.y*rxrx,2*c3.x*ryry*(c0.x-ec.x)+2*c3.y*rxrx*(c0.y-ec.y)+2*(c2.x*c1.x*ryry+c2.y*c1.y*rxrx),2*c2.x*ryry*(c0.x-ec.x)+2*c2.y*rxrx*(c0.y-ec.y)+c1.x*c1.x*ryry+c1.y*c1.y*rxrx,2*c1.x*ryry*(c0.x-ec.x)+2*c1.y*rxrx*(c0.y-ec.y),c0.x*c0.x*ryry-2*c0.y*ec.y*rxrx-2*c0.x*ec.x*ryry+c0.y*c0.y*rxrx+ec.x*ec.x*ryry+ec.y*ec.y*rxrx-rxrx*ryry);var roots=poly.getRootsInInterval(0,1);for(var i=0;i<roots.length;i++){var t=roots[i];result.points.push(c3.multiply(t*t*t).add(c2.multiply(t*t).add(c1.multiply(t).add(c0))));}if(result.points.length>0)result.status="Intersection";return result;};
Intersection.intersectBezier3Line=function(p1,p2,p3,p4,a1,a2){var a,b,c,d;var c3,c2,c1,c0;var cl;var n;var min=a1.min(a2);var max=a1.max(a2);var result=new Intersection("No Intersection");a=p1.multiply(-1);b=p2.multiply(3);c=p3.multiply(-3);d=a.add(b.add(c.add(p4)));c3=new Vector2D(d.x,d.y);a=p1.multiply(3);b=p2.multiply(-6);c=p3.multiply(3);d=a.add(b.add(c));c2=new Vector2D(d.x,d.y);a=p1.multiply(-3);b=p2.multiply(3);c=a.add(b);c1=new Vector2D(c.x,c.y);c0=new Vector2D(p1.x,p1.y);n=new Vector2D(a1.y-a2.y,a2.x-a1.x);cl=a1.x*a2.y-a2.x*a1.y;roots=new Polynomial(n.dot(c3),n.dot(c2),n.dot(c1),n.dot(c0)+cl).getRoots();for(var i=0;i<roots.length;i++){var t=roots[i];if(0<=t&&t<=1){var p5=p1.lerp(p2,t);var p6=p2.lerp(p3,t);var p7=p3.lerp(p4,t);var p8=p5.lerp(p6,t);var p9=p6.lerp(p7,t);var p10=p8.lerp(p9,t);if(a1.x==a2.x){if(min.y<=p10.y&&p10.y<=max.y){result.status="Intersection";result.appendPoint(p10);}}else if(a1.y==a2.y){if(min.x<=p10.x&&p10.x<=max.x){result.status="Intersection";result.appendPoint(p10);}}else if(p10.gte(min)&&p10.lte(max)){result.status="Intersection";result.appendPoint(p10);}}}return result;};
Intersection.intersectBezier3Polygon=function(p1,p2,p3,p4,points){var result=new Intersection("No Intersection");var length=points.length;for(var i=0;i<length;i++){var a1=points[i];var a2=points[(i+1)%length];var inter=Intersection.intersectBezier3Line(p1,p2,p3,p4,a1,a2);result.appendPoints(inter.points);}if(result.points.length>0)result.status="Intersection";return result;};
Intersection.intersectBezier3Rectangle=function(p1,p2,p3,p4,r1,r2){var min=r1.min(r2);var max=r1.max(r2);var topRight=new Point2D(max.x,min.y);var bottomLeft=new Point2D(min.x,max.y);var inter1=Intersection.intersectBezier3Line(p1,p2,p3,p4,min,topRight);var inter2=Intersection.intersectBezier3Line(p1,p2,p3,p4,topRight,max);var inter3=Intersection.intersectBezier3Line(p1,p2,p3,p4,max,bottomLeft);var inter4=Intersection.intersectBezier3Line(p1,p2,p3,p4,bottomLeft,min);var result=new Intersection("No Intersection");result.appendPoints(inter1.points);result.appendPoints(inter2.points);result.appendPoints(inter3.points);result.appendPoints(inter4.points);if(result.points.length>0)result.status="Intersection";return result;};
Intersection.intersectCircleCircle=function(c1,r1,c2,r2){var result;var r_max=r1+r2;var r_min=Math.abs(r1-r2);var c_dist=c1.distanceFrom(c2);if(c_dist>r_max){result=new Intersection("Outside");}else if(c_dist<r_min){result=new Intersection("Inside");}else{result=new Intersection("Intersection");var a=(r1*r1-r2*r2+c_dist*c_dist)/(2*c_dist);var h=Math.sqrt(r1*r1-a*a);var p=c1.lerp(c2,a/c_dist);var b=h/c_dist;result.points.push(new Point2D(p.x-b*(c2.y-c1.y),p.y+b*(c2.x-c1.x)));result.points.push(new Point2D(p.x+b*(c2.y-c1.y),p.y-b*(c2.x-c1.x)));}return result;};
Intersection.intersectCircleEllipse=function(cc,r,ec,rx,ry){return Intersection.intersectEllipseEllipse(cc,r,r,ec,rx,ry);};
Intersection.intersectCircleLine=function(c,r,a1,a2){var result;var a=(a2.x-a1.x)*(a2.x-a1.x)+(a2.y-a1.y)*(a2.y-a1.y);var b=2*((a2.x-a1.x)*(a1.x-c.x)+(a2.y-a1.y)*(a1.y-c.y));var cc=c.x*c.x+c.y*c.y+a1.x*a1.x+a1.y*a1.y-2*(c.x*a1.x+c.y*a1.y)-r*r;var deter=b*b-4*a*cc;if(deter<0){result=new Intersection("Outside");}else if(deter==0){result=new Intersection("Tangent");}else{var e=Math.sqrt(deter);var u1=(-b+e)/(2*a);var u2=(-b-e)/(2*a);if((u1<0||u1>1)&&(u2<0||u2>1)){if((u1<0&&u2<0)||(u1>1&&u2>1)){result=new Intersection("Outside");}else{result=new Intersection("Inside");}}else{result=new Intersection("Intersection");if(0<=u1&&u1<=1)result.points.push(a1.lerp(a2,u1));if(0<=u2&&u2<=1)result.points.push(a1.lerp(a2,u2));}}return result;};
Intersection.intersectCirclePolygon=function(c,r,points){var result=new Intersection("No Intersection");var length=points.length;var inter;for(var i=0;i<length;i++){var a1=points[i];var a2=points[(i+1)%length];inter=Intersection.intersectCircleLine(c,r,a1,a2);result.appendPoints(inter.points);}if(result.points.length>0)result.status="Intersection";else result.status=inter.status;return result;};
Intersection.intersectCircleRectangle=function(c,r,r1,r2){var min=r1.min(r2);var max=r1.max(r2);var topRight=new Point2D(max.x,min.y);var bottomLeft=new Point2D(min.x,max.y);var inter1=Intersection.intersectCircleLine(c,r,min,topRight);var inter2=Intersection.intersectCircleLine(c,r,topRight,max);var inter3=Intersection.intersectCircleLine(c,r,max,bottomLeft);var inter4=Intersection.intersectCircleLine(c,r,bottomLeft,min);var result=new Intersection("No Intersection");result.appendPoints(inter1.points);result.appendPoints(inter2.points);result.appendPoints(inter3.points);result.appendPoints(inter4.points);if(result.points.length>0)result.status="Intersection";else result.status=inter1.status;return result;};
Intersection.intersectEllipseEllipse=function(c1,rx1,ry1,c2,rx2,ry2){var a=[ry1*ry1,0,rx1*rx1,-2*ry1*ry1*c1.x,-2*rx1*rx1*c1.y,ry1*ry1*c1.x*c1.x+rx1*rx1*c1.y*c1.y-rx1*rx1*ry1*ry1];var b=[ry2*ry2,0,rx2*rx2,-2*ry2*ry2*c2.x,-2*rx2*rx2*c2.y,ry2*ry2*c2.x*c2.x+rx2*rx2*c2.y*c2.y-rx2*rx2*ry2*ry2];var yPoly=Intersection.bezout(a,b);var yRoots=yPoly.getRoots();var epsilon=1e-3;var norm0=(a[0]*a[0]+2*a[1]*a[1]+a[2]*a[2])*epsilon;var norm1=(b[0]*b[0]+2*b[1]*b[1]+b[2]*b[2])*epsilon;var result=new Intersection("No Intersection");for(var y=0;y<yRoots.length;y++){var xPoly=new Polynomial(a[0],a[3]+yRoots[y]*a[1],a[5]+yRoots[y]*(a[4]+yRoots[y]*a[2]));var xRoots=xPoly.getRoots();for(var x=0;x<xRoots.length;x++){var test=(a[0]*xRoots[x]+a[1]*yRoots[y]+a[3])*xRoots[x]+(a[2]*yRoots[y]+a[4])*yRoots[y]+a[5];if(Math.abs(test)<norm0){test=(b[0]*xRoots[x]+b[1]*yRoots[y]+b[3])*xRoots[x]+(b[2]*yRoots[y]+b[4])*yRoots[y]+b[5];if(Math.abs(test)<norm1){result.appendPoint(new Point2D(xRoots[x],yRoots[y]));}}}}if(result.points.length>0)result.status="Intersection";return result;};
Intersection.intersectEllipseLine=function(c,rx,ry,a1,a2){var result;var origin=new Vector2D(a1.x,a1.y);var dir=Vector2D.fromPoints(a1,a2);var center=new Vector2D(c.x,c.y);var diff=origin.subtract(center);var mDir=new Vector2D(dir.x/(rx*rx),  dir.y/(ry*ry));var mDiff=new Vector2D(diff.x/(rx*rx), diff.y/(ry*ry));var a=dir.dot(mDir);var b=dir.dot(mDiff);var c=diff.dot(mDiff)-1.0;var d=b*b-a*c;if(d<0){result=new Intersection("Outside");}else if(d>0){var root=Math.sqrt(d);var t_a=(-b-root)/a;var t_b=(-b+root)/a;if((t_a<0||1<t_a)&&(t_b<0||1<t_b)){if((t_a<0&&t_b<0)||(t_a>1&&t_b>1))result=new Intersection("Outside");else result=new Intersection("Inside");}else{result=new Intersection("Intersection");if(0<=t_a&&t_a<=1)result.appendPoint(a1.lerp(a2,t_a));if(0<=t_b&&t_b<=1)result.appendPoint(a1.lerp(a2,t_b));}}else{var t=-b/a;if(0<=t&&t<=1){result=new Intersection("Intersection");result.appendPoint(a1.lerp(a2,t));}else{result=new Intersection("Outside");}}return result;};
Intersection.intersectEllipsePolygon=function(c,rx,ry,points){var result=new Intersection("No Intersection");var length=points.length;for(var i=0;i<length;i++){var b1=points[i];var b2=points[(i+1)%length];var inter=Intersection.intersectEllipseLine(c,rx,ry,b1,b2);result.appendPoints(inter.points);}if(result.points.length>0)result.status="Intersection";return result;};
Intersection.intersectEllipseRectangle=function(c,rx,ry,r1,r2){var min=r1.min(r2);var max=r1.max(r2);var topRight=new Point2D(max.x,min.y);var bottomLeft=new Point2D(min.x,max.y);var inter1=Intersection.intersectEllipseLine(c,rx,ry,min,topRight);var inter2=Intersection.intersectEllipseLine(c,rx,ry,topRight,max);var inter3=Intersection.intersectEllipseLine(c,rx,ry,max,bottomLeft);var inter4=Intersection.intersectEllipseLine(c,rx,ry,bottomLeft,min);var result=new Intersection("No Intersection");result.appendPoints(inter1.points);result.appendPoints(inter2.points);result.appendPoints(inter3.points);result.appendPoints(inter4.points);if(result.points.length>0)result.status="Intersection";return result;};
Intersection.intersectLineLine=function(a1,a2,b1,b2){var result;var ua_t=(b2.x-b1.x)*(a1.y-b1.y)-(b2.y-b1.y)*(a1.x-b1.x);var ub_t=(a2.x-a1.x)*(a1.y-b1.y)-(a2.y-a1.y)*(a1.x-b1.x);var u_b=(b2.y-b1.y)*(a2.x-a1.x)-(b2.x-b1.x)*(a2.y-a1.y);if(u_b!=0){var ua=ua_t/u_b;var ub=ub_t/u_b;if(0<=ua&&ua<=1&&0<=ub&&ub<=1){result=new Intersection("Intersection");result.points.push(new Point2D(a1.x+ua*(a2.x-a1.x),a1.y+ua*(a2.y-a1.y)));}else{result=new Intersection("No Intersection");}}else{if(ua_t==0||ub_t==0){result=new Intersection("Coincident");}else{result=new Intersection("Parallel");}}return result;};
Intersection.intersectLinePolygon=function(a1,a2,points){var result=new Intersection("No Intersection");var length=points.length;for(var i=0;i<length;i++){var b1=points[i];var b2=points[(i+1)%length];var inter=Intersection.intersectLineLine(a1,a2,b1,b2);result.appendPoints(inter.points);}if(result.points.length>0)result.status="Intersection";return result;};
Intersection.intersectLineRectangle=function(a1,a2,r1,r2){var min=r1.min(r2);var max=r1.max(r2);var topRight=new Point2D(max.x,min.y);var bottomLeft=new Point2D(min.x,max.y);var inter1=Intersection.intersectLineLine(min,topRight,a1,a2);var inter2=Intersection.intersectLineLine(topRight,max,a1,a2);var inter3=Intersection.intersectLineLine(max,bottomLeft,a1,a2);var inter4=Intersection.intersectLineLine(bottomLeft,min,a1,a2);var result=new Intersection("No Intersection");result.appendPoints(inter1.points);result.appendPoints(inter2.points);result.appendPoints(inter3.points);result.appendPoints(inter4.points);if(result.points.length>0)result.status="Intersection";return result;};
Intersection.intersectPolygonPolygon=function(points1,points2){var result=new Intersection("No Intersection");var length=points1.length;for(var i=0;i<length;i++){var a1=points1[i];var a2=points1[(i+1)%length];var inter=Intersection.intersectLinePolygon(a1,a2,points2);result.appendPoints(inter.points);}if(result.points.length>0)result.status="Intersection";return result;};
Intersection.intersectPolygonRectangle=function(points,r1,r2){var min=r1.min(r2);var max=r1.max(r2);var topRight=new Point2D(max.x,min.y);var bottomLeft=new Point2D(min.x,max.y);var inter1=Intersection.intersectLinePolygon(min,topRight,points);var inter2=Intersection.intersectLinePolygon(topRight,max,points);var inter3=Intersection.intersectLinePolygon(max,bottomLeft,points);var inter4=Intersection.intersectLinePolygon(bottomLeft,min,points);var result=new Intersection("No Intersection");result.appendPoints(inter1.points);result.appendPoints(inter2.points);result.appendPoints(inter3.points);result.appendPoints(inter4.points);if(result.points.length>0)result.status="Intersection";return result;};
Intersection.intersectRayRay=function(a1,a2,b1,b2){var result;var ua_t=(b2.x-b1.x)*(a1.y-b1.y)-(b2.y-b1.y)*(a1.x-b1.x);var ub_t=(a2.x-a1.x)*(a1.y-b1.y)-(a2.y-a1.y)*(a1.x-b1.x);var u_b=(b2.y-b1.y)*(a2.x-a1.x)-(b2.x-b1.x)*(a2.y-a1.y);if(u_b!=0){var ua=ua_t/u_b;result=new Intersection("Intersection");result.points.push(new Point2D(a1.x+ua*(a2.x-a1.x),a1.y+ua*(a2.y-a1.y)));}else{if(ua_t==0||ub_t==0){result=new Intersection("Coincident");}else{result=new Intersection("Parallel");}}return result;};
Intersection.intersectRectangleRectangle=function(a1,a2,b1,b2){var min=a1.min(a2);var max=a1.max(a2);var topRight=new Point2D(max.x,min.y);var bottomLeft=new Point2D(min.x,max.y);var inter1=Intersection.intersectLineRectangle(min,topRight,b1,b2);var inter2=Intersection.intersectLineRectangle(topRight,max,b1,b2);var inter3=Intersection.intersectLineRectangle(max,bottomLeft,b1,b2);var inter4=Intersection.intersectLineRectangle(bottomLeft,min,b1,b2);var result=new Intersection("No Intersection");result.appendPoints(inter1.points);result.appendPoints(inter2.points);result.appendPoints(inter3.points);result.appendPoints(inter4.points);if(result.points.length>0)result.status="Intersection";return result;};
Intersection.bezout=function(e1,e2){var AB=e1[0]*e2[1]-e2[0]*e1[1];var AC=e1[0]*e2[2]-e2[0]*e1[2];var AD=e1[0]*e2[3]-e2[0]*e1[3];var AE=e1[0]*e2[4]-e2[0]*e1[4];var AF=e1[0]*e2[5]-e2[0]*e1[5];var BC=e1[1]*e2[2]-e2[1]*e1[2];var BE=e1[1]*e2[4]-e2[1]*e1[4];var BF=e1[1]*e2[5]-e2[1]*e1[5];var CD=e1[2]*e2[3]-e2[2]*e1[3];var DE=e1[3]*e2[4]-e2[3]*e1[4];var DF=e1[3]*e2[5]-e2[3]*e1[5];var BFpDE=BF+DE;var BEmCD=BE-CD;return new Polynomial(AB*BC-AC*AC,AB*BEmCD+AD*BC-2*AC*AE,AB*BFpDE+AD*BEmCD-AE*AE-2*AC*AF,AB*DF+AD*BFpDE-2*AE*AF,AD*DF-AF*AF);};
function IntersectionParams(name,params){if(arguments.length>0)this.init(name,params);}
IntersectionParams.prototype.init=function(name,params){this.name=name;this.params=params;};
function Point2D(x,y){if(arguments.length>0){this.init(x,y);}}
Point2D.prototype.init=function(x,y){this.x=x;this.y=y;};
Point2D.prototype.add=function(that){return new Point2D(this.x+that.x,this.y+that.y);};
Point2D.prototype.addEquals=function(that){this.x+=that.x;this.y+=that.y;return this;};
Point2D.prototype.scalarAdd=function(scalar){return new Point2D(this.x+scalar,this.y+scalar);};
Point2D.prototype.scalarAddEquals=function(scalar){this.x+=scalar;this.y+=scalar;return this;};
Point2D.prototype.subtract=function(that){return new Point2D(this.x-that.x,this.y-that.y);};
Point2D.prototype.subtractEquals=function(that){this.x-=that.x;this.y-=that.y;return this;};
Point2D.prototype.scalarSubtract=function(scalar){return new Point2D(this.x-scalar,this.y-scalar);};
Point2D.prototype.scalarSubtractEquals=function(scalar){this.x-=scalar;this.y-=scalar;return this;};
Point2D.prototype.multiply=function(scalar){return new Point2D(this.x*scalar,this.y*scalar);};
Point2D.prototype.multiplyEquals=function(scalar){this.x*=scalar;this.y*=scalar;return this;};
Point2D.prototype.divide=function(scalar){return new Point2D(this.x/scalar, this.y/scalar);};
Point2D.prototype.divideEquals=function(scalar){this.x/=scalar;this.y/=scalar;return this;};
Point2D.prototype.eq=function(that){return(this.x==that.x&&this.y==that.y);};
Point2D.prototype.lt=function(that){return(this.x<that.x&&this.y<that.y);};
Point2D.prototype.lte=function(that){return(this.x<=that.x&&this.y<=that.y);};
Point2D.prototype.gt=function(that){return(this.x>that.x&&this.y>that.y);};
Point2D.prototype.gte=function(that){return(this.x>=that.x&&this.y>=that.y);};
Point2D.prototype.lerp=function(that,t){return new Point2D(this.x+(that.x-this.x)*t,this.y+(that.y-this.y)*t);};
Point2D.prototype.distanceFrom=function(that){var dx=this.x-that.x;var dy=this.y-that.y;return Math.sqrt(dx*dx+dy*dy);};
Point2D.prototype.min=function(that){return new Point2D(Math.min(this.x,that.x),Math.min(this.y,that.y));};
Point2D.prototype.max=function(that){return new Point2D(Math.max(this.x,that.x),Math.max(this.y,that.y));};
Point2D.prototype.toString=function(){return this.x+","+this.y;};
Point2D.prototype.setXY=function(x,y){this.x=x;this.y=y;};
Point2D.prototype.setFromPoint=function(that){this.x=that.x;this.y=that.y;};
Point2D.prototype.swap=function(that){var x=this.x;var y=this.y;this.x=that.x;this.y=that.y;that.x=x;that.y=y;};
Polynomial.TOLERANCE=1e-6;
Polynomial.ACCURACY=6;
function Polynomial(){this.init(arguments);}
Polynomial.prototype.init=function(coefs){this.coefs=new Array();for(var i=coefs.length-1;i>=0;i--)this.coefs.push(coefs[i]);};
Polynomial.prototype.eval=function(x){var result=0;for(var i=this.coefs.length-1;i>=0;i--)result=result*x+this.coefs[i];return result;};
Polynomial.prototype.multiply=function(that){var result=new Polynomial();for(var i=0;i<=this.getDegree()+that.getDegree();i++)result.coefs.push(0);for(var i=0;i<=this.getDegree();i++)for(var j=0;j<=that.getDegree();j++)result.coefs[i+j]+=this.coefs[i]*that.coefs[j];return result;};
Polynomial.prototype.divide_scalar=function(scalar){for(var i=0;i<this.coefs.length;i++)this.coefs[i]/=scalar;};
Polynomial.prototype.simplify=function(){for(var i=this.getDegree();i>=0;i--){if(Math.abs(this.coefs[i])<=Polynomial.TOLERANCE)this.coefs.pop();else break;}};
Polynomial.prototype.bisection=function(min,max){var minValue=this.eval(min);var maxValue=this.eval(max);var result;if(Math.abs(minValue)<=Polynomial.TOLERANCE)result=min;else if(Math.abs(maxValue)<=Polynomial.TOLERANCE)result=max;else if(minValue*maxValue<=0){var tmp1=Math.log(max-min);var tmp2=Math.log(10)*Polynomial.ACCURACY;var iters=Math.ceil((tmp1+tmp2)/Math.log(2));for(var i=0;i<iters;i++){result=0.5*(min+max);var value=this.eval(result);if(Math.abs(value)<=Polynomial.TOLERANCE){break;}if(value*minValue<0){max=result;maxValue=value;}else{min=result;minValue=value;}}}return result;};
Polynomial.prototype.toString=function(){var coefs=new Array();var signs=new Array();for(var i=this.coefs.length-1;i>=0;i--){var value=this.coefs[i];if(value!=0){var sign=(value<0)?" - ":" + ";value=Math.abs(value);if(i>0)if(value==1)value="x";else value+="x";if(i>1)value+="^"+i;signs.push(sign);coefs.push(value);}}signs[0]=(signs[0]==" + ")?"":"-";var result="";for(var i=0;i<coefs.length;i++)result+=signs[i]+coefs[i];return result;};
Polynomial.prototype.getDegree=function(){return this.coefs.length-1;};
Polynomial.prototype.getDerivative=function(){var derivative=new Polynomial();for(var i=1;i<this.coefs.length;i++){derivative.coefs.push(i*this.coefs[i]);}return derivative;};
Polynomial.prototype.getRoots=function(){var result;this.simplify();switch(this.getDegree()){case 0:result=new Array();break;case 1:result=this.getLinearRoot();break;case 2:result=this.getQuadraticRoots();break;case 3:result=this.getCubicRoots();break;case 4:result=this.getQuarticRoots();break;default:result=new Array();}return result;};
Polynomial.prototype.getRootsInInterval=function(min,max){var roots=new Array();var root;if(this.getDegree()==1){root=this.bisection(min,max);if(root!=null)roots.push(root);}else{var deriv=this.getDerivative();var droots=deriv.getRootsInInterval(min,max);if(droots.length>0){root=this.bisection(min,droots[0]);if(root!=null)roots.push(root);for(i=0;i<=droots.length-2;i++){root=this.bisection(droots[i],droots[i+1]);if(root!=null)roots.push(root);}root=this.bisection(droots[droots.length-1],max);if(root!=null)roots.push(root);}else{root=this.bisection(min,max);if(root!=null)roots.push(root);}}return roots;};
Polynomial.prototype.getLinearRoot=function(){var result=new Array();var a=this.coefs[1];if(a!=0)result.push(-this.coefs[0]/a);return result;};
Polynomial.prototype.getQuadraticRoots=function(){var results=new Array();if(this.getDegree()==2){var a=this.coefs[2];var b=this.coefs[1]/a;var c=this.coefs[0]/a;var d=b*b-4*c;if(d>0){var e=Math.sqrt(d);results.push(0.5*(-b+e));results.push(0.5*(-b-e));}else if(d==0){results.push(0.5*-b);}}return results;};
Polynomial.prototype.getCubicRoots=function(){var results=new Array();if(this.getDegree()==3){var c3=this.coefs[3];var c2=this.coefs[2]/c3;var c1=this.coefs[1]/c3;var c0=this.coefs[0]/c3;var a=(3*c1-c2*c2)/3;var b=(2*c2*c2*c2-9*c1*c2+27*c0)/27;var offset=c2/3;var discrim=b*b/4 + a*a*a/27;var halfB=b/2;if(Math.abs(discrim)<=Polynomial.TOLERANCE)disrim=0;if(discrim>0){var e=Math.sqrt(discrim);var tmp;var root;tmp=-halfB+e;if(tmp>=0)root=Math.pow(tmp,1/3);else root=-Math.pow(-tmp,1/3);tmp=-halfB-e;if(tmp>=0)root+=Math.pow(tmp,1/3);else root-=Math.pow(-tmp,1/3);results.push(root-offset);}else if(discrim<0){var distance=Math.sqrt(-a/3);var angle=Math.atan2(Math.sqrt(-discrim),-halfB)/3;var cos=Math.cos(angle);var sin=Math.sin(angle);var sqrt3=Math.sqrt(3);results.push(2*distance*cos-offset);results.push(-distance*(cos+sqrt3*sin)-offset);results.push(-distance*(cos-sqrt3*sin)-offset);}else{var tmp;if(halfB>=0)tmp=-Math.pow(halfB,1/3);else tmp=Math.pow(-halfB,1/3);results.push(2*tmp-offset);results.push(-tmp-offset);}}return results;};
Polynomial.prototype.getQuarticRoots=function(){var results=new Array();if(this.getDegree()==4){var c4=this.coefs[4];var c3=this.coefs[3]/c4;var c2=this.coefs[2]/c4;var c1=this.coefs[1]/c4;var c0=this.coefs[0]/c4;var resolveRoots=new Polynomial(1,-c2,c3*c1-4*c0,-c3*c3*c0+4*c2*c0-c1*c1).getCubicRoots();var y=resolveRoots[0];var discrim=c3*c3/4-c2+y;if(Math.abs(discrim)<=Polynomial.TOLERANCE)discrim=0;if(discrim>0){var e=Math.sqrt(discrim);var t1=3*c3*c3/4-e*e-2*c2;var t2=(4*c3*c2-8*c1-c3*c3*c3)/(4*e);var plus=t1+t2;var minus=t1-t2;if(Math.abs(plus)<=Polynomial.TOLERANCE)plus=0;if(Math.abs(minus)<=Polynomial.TOLERANCE)minus=0;if(plus>=0){var f=Math.sqrt(plus);results.push(-c3/4 + (e+f)/2);results.push(-c3/4 + (e-f)/2);}if(minus>=0){var f=Math.sqrt(minus);results.push(-c3/4 + (f-e)/2);results.push(-c3/4 - (f+e)/2);}}else if(discrim<0){}else{var t2=y*y-4*c0;if(t2>=-Polynomial.TOLERANCE){if(t2<0)t2=0;t2=2*Math.sqrt(t2);t1=3*c3*c3/4-2*c2;if(t1+t2>=Polynomial.TOLERANCE){var d=Math.sqrt(t1+t2);results.push(-c3/4 + d/2);results.push(-c3/4 - d/2);}if(t1-t2>=Polynomial.TOLERANCE){var d=Math.sqrt(t1-t2);results.push(-c3/4 + d/2);results.push(-c3/4 - d/2);}}}}return results;};
function Vector2D(x,y){if(arguments.length>0){this.init(x,y);}}
Vector2D.prototype.init=function(x,y){this.x=x;this.y=y;};
Vector2D.prototype.length=function(){return Math.sqrt(this.x*this.x+this.y*this.y);};
Vector2D.prototype.dot=function(that){return this.x*that.x+this.y*that.y;};
Vector2D.prototype.cross=function(that){return this.x*that.y-this.y*that.x;}
Vector2D.prototype.unit=function(){return this.divide(this.length());};
Vector2D.prototype.unitEquals=function(){this.divideEquals(this.length());return this;};
Vector2D.prototype.add=function(that){return new Vector2D(this.x+that.x,this.y+that.y);};
Vector2D.prototype.addEquals=function(that){this.x+=that.x;this.y+=that.y;return this;};
Vector2D.prototype.subtract=function(that){return new Vector2D(this.x-that.x,this.y-that.y);};
Vector2D.prototype.subtractEquals=function(that){this.x-=that.x;this.y-=that.y;return this;};
Vector2D.prototype.multiply=function(scalar){return new Vector2D(this.x*scalar,this.y*scalar);};
Vector2D.prototype.multiplyEquals=function(scalar){this.x*=scalar;this.y*=scalar;return this;};
Vector2D.prototype.divide=function(scalar){return new Vector2D(this.x/ scalar, this.y /scalar);};
Vector2D.prototype.divideEquals=function(scalar){this.x/=scalar;this.y/=scalar;return this;};
Vector2D.prototype.perp=function(){return new Vector2D(-this.y,this.x);};
Vector2D.fromPoints=function(p1,p2){return new Vector2D(p2.x-p1.x,p2.y-p1.y);};
Shape.prototype=new EventHandler();
Shape.prototype.constructor=Shape;
Shape.superclass=EventHandler.prototype;
function Shape(svgNode){if(arguments.length>0){this.init(svgNode);}}
Shape.prototype.init=function(svgNode){this.svgNode=svgNode;this.locked=false;this.visible=true;this.selected=false;this.callback=null;this.lastUpdate=null;}
Shape.prototype.show=function(state){var display=(state)?"inline":"none";this.visible=state;this.svgNode.setAttributeNS(null,"display",display);};
Shape.prototype.refresh=function(){};
Shape.prototype.update=function(){this.refresh();if(this.owner)this.owner.update(this);if(this.callback!=null)this.callback(this);};
Shape.prototype.translate=function(delta){};
Shape.prototype.select=function(state){this.selected=state;};
Shape.prototype.registerHandles=function(){};
Shape.prototype.unregisterHandles=function(){};
Shape.prototype.selectHandles=function(select){};
Shape.prototype.showHandles=function(state){};
Shape.prototype.mousedown=function(e){if(!this.locked){if(e.shiftKey){if(this.selected){mouser.unregisterShape(this);}else{mouser.registerShape(this);this.showHandles(true);this.selectHandles(true);this.registerHandles();}}else{if(this.selected){this.selectHandles(true);this.registerHandles();}else{mouser.unregisterShapes();mouser.registerShape(this);this.showHandles(true);this.selectHandles(false);}}}};
Circle.prototype=new Shape();
Circle.prototype.constructor=Circle;
Circle.superclass=Shape.prototype;
function Circle(svgNode){if(arguments.length>0){this.init(svgNode);}}
Circle.prototype.init=function(svgNode){if(svgNode.localName=="circle"){Circle.superclass.init.call(this,svgNode);var cx=parseFloat(svgNode.getAttributeNS(null,"cx"));var cy=parseFloat(svgNode.getAttributeNS(null,"cy"));var r=parseFloat(svgNode.getAttributeNS(null,"r"));this.center=new Handle(cx,cy,this);this.last=new Point2D(cx,cy);this.radius=new Handle(cx+r,cy,this);}else{throw new Error("Circle.init: Invalid SVG Node: "+svgNode.localName);}};
Circle.prototype.realize=function(){if(this.svgNode!=null){this.center.realize();this.radius.realize();this.center.show(false);this.radius.show(false);this.svgNode.addEventListener("mousedown",this,false);}};
Circle.prototype.translate=function(delta){this.center.translate(delta);this.radius.translate(delta);this.refresh();};
Circle.prototype.refresh=function(){var r=this.radius.point.distanceFrom(this.center.point);this.svgNode.setAttributeNS(null,"cx",this.center.point.x);this.svgNode.setAttributeNS(null,"cy",this.center.point.y);this.svgNode.setAttributeNS(null,"r",r);};
Circle.prototype.registerHandles=function(){mouser.register(this.center);mouser.register(this.radius);};
Circle.prototype.unregisterHandles=function(){mouser.unregister(this.center);mouser.unregister(this.radius);};
Circle.prototype.selectHandles=function(select){this.center.select(select);this.radius.select(select);};
Circle.prototype.showHandles=function(state){this.center.show(state);this.radius.show(state);};
Circle.prototype.getIntersectionParams=function(){return new IntersectionParams("Circle",[this.center.point,parseFloat(this.svgNode.getAttributeNS(null,"r"))]);};
Ellipse.prototype=new Shape();
Ellipse.prototype.constructor=Ellipse;
Ellipse.superclass=Shape.prototype;
function Ellipse(svgNode){if(arguments.length>0){this.init(svgNode);}}
Ellipse.prototype.init=function(svgNode){if(svgNode==null||svgNode.localName!="ellipse")throw new Error("Ellipse.init: Invalid localName: "+svgNode.localName);Ellipse.superclass.init.call(this,svgNode);var cx=parseFloat(svgNode.getAttributeNS(null,"cx"));var cy=parseFloat(svgNode.getAttributeNS(null,"cy"));var rx=parseFloat(svgNode.getAttributeNS(null,"rx"));var ry=parseFloat(svgNode.getAttributeNS(null,"ry"));this.center=new Handle(cx,cy,this);this.radiusX=new Handle(cx+rx,cy,this);this.radiusY=new Handle(cx,cy+ry,this);};
Ellipse.prototype.realize=function(){this.center.realize();this.radiusX.realize();this.radiusY.realize();this.center.show(false);this.radiusX.show(false);this.radiusY.show(false);this.svgNode.addEventListener("mousedown",this,false);};
Ellipse.prototype.refresh=function(){var rx=Math.abs(this.center.point.x-this.radiusX.point.x);var ry=Math.abs(this.center.point.y-this.radiusY.point.y);this.svgNode.setAttributeNS(null,"cx",this.center.point.x);this.svgNode.setAttributeNS(null,"cy",this.center.point.y);this.svgNode.setAttributeNS(null,"rx",rx);this.svgNode.setAttributeNS(null,"ry",ry);};
Ellipse.prototype.registerHandles=function(){mouser.register(this.center);mouser.register(this.radiusX);mouser.register(this.radiusY);};
Ellipse.prototype.unregisterHandles=function(){mouser.unregister(this.center);mouser.unregister(this.radiusX);mouser.unregister(this.radiusY);};
Ellipse.prototype.selectHandles=function(select){this.center.select(select);this.radiusX.select(select);this.radiusY.select(select);};
Ellipse.prototype.showHandles=function(state){this.center.show(state);this.radiusX.show(state);this.radiusY.show(state);};
Ellipse.prototype.getIntersectionParams=function(){return new IntersectionParams("Ellipse",[this.center.point,parseFloat(this.svgNode.getAttributeNS(null,"rx")),parseFloat(this.svgNode.getAttributeNS(null,"ry"))]);};
Handle.prototype=new Shape();
Handle.prototype.constructor=Handle;
Handle.superclass=Shape.prototype;
Handle.NO_CONSTRAINTS=0;
Handle.CONSTRAIN_X=1;
Handle.CONSTRAIN_Y=2;
function Handle(x,y,owner){if(arguments.length>0){this.init(x,y,owner);}}
Handle.prototype.init=function(x,y,owner){Handle.superclass.init.call(this,null);this.point=new Point2D(x,y);this.owner=owner;this.constrain=Handle.NO_CONSTRAINTS;}
Handle.prototype.realize=function(){if(this.svgNode==null){var svgns="http://www.w3.org/2000/svg";var handle=svgDocument.createElementNS(svgns,"rect");var parent;if(this.owner!=null&&this.owner.svgNode!=null){parent=this.owner.svgNode.parentNode;}else{parent=svgDocument.documentElement;}handle.setAttributeNS(null,"x",this.point.x-2);handle.setAttributeNS(null,"y",this.point.y-2);handle.setAttributeNS(null,"width",4);handle.setAttributeNS(null,"height",4);handle.setAttributeNS(null,"stroke","black");handle.setAttributeNS(null,"fill","white");handle.addEventListener("mousedown",this,false);parent.appendChild(handle);this.svgNode=handle;this.show(this.visible);}};
Handle.prototype.unrealize=function(){this.svgNode.removeEventListener("mousedown",this,false);this.svgNode.parentNode.removeChild(this.svgNode);};
Handle.prototype.translate=function(delta){if(this.constrain==Handle.CONSTRAIN_X){this.point.x+=delta.x;}else if(this.constrain==Handle.CONSTRAIN_Y){this.point.y+=delta.y;}else{this.point.addEquals(delta);}this.refresh();};
Handle.prototype.refresh=function(){this.svgNode.setAttributeNS(null,"x",this.point.x-2);this.svgNode.setAttributeNS(null,"y",this.point.y-2);};
Handle.prototype.select=function(state){Handle.superclass.select.call(this,state);if(state){this.svgNode.setAttributeNS(null,"fill","black");}else{this.svgNode.setAttributeNS(null,"fill","white");}};
Handle.prototype.mousedown=function(e){if(!this.locked){if(e.shiftKey){if(this.selected){mouser.unregister(this);}else{mouser.register(this);mouser.beginDrag(e);}}else{if(!this.selected){var owner=this.owner;mouser.unregisterAll();mouser.register(this);}mouser.beginDrag(e);}}};
Lever.prototype=new Shape();
Lever.prototype.constructor=Lever;
Lever.superclass=Shape.prototype;
function Lever(x1,y1,x2,y2,owner){if(arguments.length>0){this.init(x1,y1,x2,y2,owner);}}
Lever.prototype.init=function(x1,y1,x2,y2,owner){Lever.superclass.init.call(this,null);this.point=new Handle(x1,y1,this);this.lever=new LeverHandle(x2,y2,this);this.owner=owner;};
Lever.prototype.realize=function(){if(this.svgNode==null){var svgns="http://www.w3.org/2000/svg";var line=svgDocument.createElementNS(svgns,"line");var parent;if(this.owner!=null&&this.owner.svgNode!=null){parent=this.owner.svgNode.parentNode;}else{parent=svgDocument.documentElement;}line.setAttributeNS(null,"x1",this.point.point.x);line.setAttributeNS(null,"y1",this.point.point.y);line.setAttributeNS(null,"x2",this.lever.point.x);line.setAttributeNS(null,"y2",this.lever.point.y);line.setAttributeNS(null,"stroke","black");parent.appendChild(line);this.svgNode=line;this.point.realize();this.lever.realize();this.show(this.visible);}};
Lever.prototype.refresh=function(){this.svgNode.setAttributeNS(null,"x1",this.point.point.x);this.svgNode.setAttributeNS(null,"y1",this.point.point.y);this.svgNode.setAttributeNS(null,"x2",this.lever.point.x);this.svgNode.setAttributeNS(null,"y2",this.lever.point.y);};
LeverHandle.prototype=new Handle();
LeverHandle.prototype.constructor=LeverHandle;
LeverHandle.superclass=Handle.prototype;
function LeverHandle(x,y,owner){if(arguments.length>0){this.init(x,y,owner);}}
LeverHandle.prototype.realize=function(){if(this.svgNode==null){var svgns="http://www.w3.org/2000/svg";var handle=svgDocument.createElementNS(svgns,"circle");var parent;if(this.owner!=null&&this.owner.svgNode!=null){parent=this.owner.svgNode.parentNode;}else{parent=svgDocument.documentElement;}handle.setAttributeNS(null,"cx",this.point.x);handle.setAttributeNS(null,"cy",this.point.y);handle.setAttributeNS(null,"r",2.5);handle.setAttributeNS(null,"fill","black");handle.addEventListener("mousedown",this,false);parent.appendChild(handle);this.svgNode=handle;this.show(this.visible);}};
LeverHandle.prototype.refresh=function(){this.svgNode.setAttributeNS(null,"cx",this.point.x);this.svgNode.setAttributeNS(null,"cy",this.point.y);};
LeverHandle.prototype.select=function(state){LeverHandle.superclass.select.call(this,state);this.svgNode.setAttributeNS(null,"fill","black");};
Line.prototype=new Shape();
Line.prototype.constructor=Line;
Line.superclass=Shape.prototype;
function Line(svgNode){if(arguments.length>0){this.init(svgNode);}}
Line.prototype.init=function(svgNode){if(svgNode==null||svgNode.localName!="line")throw new Error("Line.init: Invalid localName: "+svgNode.localName);Line.superclass.init.call(this,svgNode);var x1=parseFloat(svgNode.getAttributeNS(null,"x1"));var y1=parseFloat(svgNode.getAttributeNS(null,"y1"));var x2=parseFloat(svgNode.getAttributeNS(null,"x2"));var y2=parseFloat(svgNode.getAttributeNS(null,"y2"));this.p1=new Handle(x1,y1,this);this.p2=new Handle(x2,y2,this);};
Line.prototype.realize=function(){this.p1.realize();this.p2.realize();this.p1.show(false);this.p2.show(false);this.svgNode.addEventListener("mousedown",this,false);};
Line.prototype.refresh=function(){this.svgNode.setAttributeNS(null,"x1",this.p1.point.x);this.svgNode.setAttributeNS(null,"y1",this.p1.point.y);this.svgNode.setAttributeNS(null,"x2",this.p2.point.x);this.svgNode.setAttributeNS(null,"y2",this.p2.point.y);};
Line.prototype.registerHandles=function(){mouser.register(this.p1);mouser.register(this.p2);};
Line.prototype.unregisterHandles=function(){mouser.unregister(this.p1);mouser.unregister(this.p2);};
Line.prototype.selectHandles=function(select){this.p1.select(select);this.p2.select(select);};
Line.prototype.showHandles=function(state){this.p1.show(state);this.p2.show(state);};
Line.prototype.cut=function(t){var cutPoint=this.p1.point.lerp(this.p2.point,t);var newLine=this.svgNode.cloneNode(true);this.p2.point.setFromPoint(cutPoint);this.p2.update();if(this.svgNode.nextSibling!=null)this.svgNode.parentNode.insertBefore(newLine,this.svgNode.nextSibling);else this.svgNode.parentNode.appendChild(newLine);var line=new Line(newLine);line.realize();line.p1.point.setFromPoint(cutPoint);line.p1.update();};
Line.prototype.getIntersectionParams=function(){return new IntersectionParams("Line",[this.p1.point,this.p2.point]);};
function Token(type,text){if(arguments.length>0){this.init(type,text);}}
Token.prototype.init=function(type,text){this.type=type;this.text=text;};
Token.prototype.typeis=function(type){return this.type==type;}
Path.prototype=new Shape();
Path.prototype.constructor=Path;
Path.superclass=Shape.prototype;
Path.COMMAND=0;
Path.NUMBER=1;
Path.EOD=2;
Path.PARAMS={A:["rx","ry","x-axis-rotation","large-arc-flag","sweep-flag","x","y"],a:["rx","ry","x-axis-rotation","large-arc-flag","sweep-flag","x","y"],C:["x1","y1","x2","y2","x","y"],c:["x1","y1","x2","y2","x","y"],H:["x"],h:["x"],L:["x","y"],l:["x","y"],M:["x","y"],m:["x","y"],Q:["x1","y1","x","y"],q:["x1","y1","x","y"],S:["x2","y2","x","y"],s:["x2","y2","x","y"],T:["x","y"],t:["x","y"],V:["y"],v:["y"],Z:[],z:[]};
function Path(svgNode){if(arguments.length>0){this.init(svgNode);}}
Path.prototype.init=function(svgNode){if(svgNode==null||svgNode.localName!="path")throw new Error("Path.init: Invalid localName: "+svgNode.localName);Path.superclass.init.call(this,svgNode);this.segments=null;this.parseData(svgNode.getAttributeNS(null,"d"));};
Path.prototype.realize=function(){for(var i=0;i<this.segments.length;i++){this.segments[i].realize();}this.svgNode.addEventListener("mousedown",this,false);};
Path.prototype.unrealize=function(){for(var i=0;i<this.segments.length;i++){this.segments[i].unrealize();}this.svgNode.removeEventListener("mousedown",this,false);};
Path.prototype.refresh=function(){var d=new Array();for(var i=0;i<this.segments.length;i++){d.push(this.segments[i].toString());}this.svgNode.setAttributeNS(null,"d",d.join(" "));};
Path.prototype.registerHandles=function(){for(var i=0;i<this.segments.length;i++){this.segments[i].registerHandles();}};
Path.prototype.unregisterHandles=function(){for(var i=0;i<this.segments.length;i++){this.segments[i].unregisterHandles();}};
Path.prototype.selectHandles=function(select){for(var i=0;i<this.segments.length;i++){this.segments[i].selectHandles(select);}};
Path.prototype.showHandles=function(state){for(var i=0;i<this.segments.length;i++){this.segments[i].showHandles(state);}};
Path.prototype.appendPathSegment=function(segment){segment.previous=this.segments[this.segments.length-1];this.segments.push(segment);};
Path.prototype.parseData=function(d){var tokens=this.tokenize(d);var index=0;var token=tokens[index];var mode="BOD";this.segments=new Array();while(!token.typeis(Path.EOD)){var param_length;var params=new Array();if(mode=="BOD"){if(token.text=="M"||token.text=="m"){index++;param_length=Path.PARAMS[token.text].length;mode=token.text;}else{throw new Error("Path data must begin with a moveto command");}}else{if(token.typeis(Path.NUMBER)){param_length=Path.PARAMS[mode].length;}else{index++;param_length=Path.PARAMS[token.text].length;mode=token.text;}}if((index+param_length)<tokens.length){for(var i=index;i<index+param_length;i++){var number=tokens[i];if(number.typeis(Path.NUMBER))params[params.length]=number.text;else throw new Error("Parameter type is not a number: "+mode+","+number.text);}var segment;var length=this.segments.length;var previous=(length==0)?null:this.segments[length-1];switch(mode){case"A":segment=new AbsoluteArcPath(params,this,previous);break;case"C":segment=new AbsoluteCurveto3(params,this,previous);break;case"c":segment=new RelativeCurveto3(params,this,previous);break;case"H":segment=new AbsoluteHLineto(params,this,previous);break;case"L":segment=new AbsoluteLineto(params,this,previous);break;case"l":segment=new RelativeLineto(params,this,previous);break;case"M":segment=new AbsoluteMoveto(params,this,previous);break;case"m":segment=new RelativeMoveto(params,this,previous);break;case"Q":segment=new AbsoluteCurveto2(params,this,previous);break;case"q":segment=new RelativeCurveto2(params,this,previous);break;case"S":segment=new AbsoluteSmoothCurveto3(params,this,previous);break;case"s":segment=new RelativeSmoothCurveto3(params,this,previous);break;case"T":segment=new AbsoluteSmoothCurveto2(params,this,previous);break;case"t":segment=new RelativeSmoothCurveto2(params,this,previous);break;case"Z":segment=new RelativeClosePath(params,this,previous);break;case"z":segment=new RelativeClosePath(params,this,previous);break;default:throw new Error("Unsupported segment type: "+mode);};this.segments.push(segment);index+=param_length;token=tokens[index];if(mode=="M")mode="L";if(mode=="m")mode="l";}else{throw new Error("Path data ended before all parameters were found");}}}
Path.prototype.tokenize=function(d){var tokens=new Array();while(d!=""){if(d.match(/^([ \t\r\n,]+)/)){d=d.substr(RegExp.$1.length);}else if(d.match(/^([aAcChHlLmMqQsStTvVzZ])/)){tokens[tokens.length]=new Token(Path.COMMAND,RegExp.$1);d=d.substr(RegExp.$1.length);}else if(d.match(/^(([-+]?[0-9]+(\.[0-9]*)?|[-+]?\.[0-9]+)([eE][-+]?[0-9]+)?)/)){tokens[tokens.length]=new Token(Path.NUMBER,parseFloat(RegExp.$1));d=d.substr(RegExp.$1.length);}else{throw new Error("Unrecognized segment command: "+d);}}tokens[tokens.length]=new Token(Path.EOD,null);return tokens;}
Path.prototype.intersectShape=function(shape){var result=new Intersection("No Intersection");for(var i=0;i<this.segments.length;i++){var inter=Intersection.intersectShapes(this.segments[i],shape);result.appendPoints(inter.points);}if(result.points.length>0)result.status="Intersection";return result;};
Path.prototype.getIntersectionParams=function(){return new IntersectionParams("Path",[]);};
function AbsolutePathSegment(command,params,owner,previous){if(arguments.length>0)this.init(command,params,owner,previous);};
AbsolutePathSegment.prototype.init=function(command,params,owner,previous){this.command=command;this.owner=owner;this.previous=previous;this.handles=new Array();var index=0;while(index<params.length){var handle=new Handle(params[index],params[index+1],owner);this.handles.push(handle);index+=2;}};
AbsolutePathSegment.prototype.realize=function(){for(var i=0;i<this.handles.length;i++){var handle=this.handles[i];handle.realize();handle.show(false);}};
AbsolutePathSegment.prototype.unrealize=function(){for(var i=0;i<this.handles.length;i++){this.handles[i].unrealize();}};
AbsolutePathSegment.prototype.registerHandles=function(){for(var i=0;i<this.handles.length;i++){mouser.register(this.handles[i]);}};
AbsolutePathSegment.prototype.unregisterHandles=function(){for(var i=0;i<this.handles.length;i++){mouser.unregister(this.handles[i]);}};
AbsolutePathSegment.prototype.selectHandles=function(select){for(var i=0;i<this.handles.length;i++){this.handles[i].select(select);}};
AbsolutePathSegment.prototype.showHandles=function(state){for(var i=0;i<this.handles.length;i++){this.handles[i].show(state);}};
AbsolutePathSegment.prototype.toString=function(){var points=new Array();var command="";if(this.previous==null||this.previous.constructor!=this.constuctor)command=this.command;for(var i=0;i<this.handles.length;i++){points.push(this.handles[i].point.toString());}return command+points.join(" ");};
AbsolutePathSegment.prototype.getLastPoint=function(){return this.handles[this.handles.length-1].point;};
AbsolutePathSegment.prototype.getIntersectionParams=function(){return null;};
AbsoluteArcPath.prototype=new AbsolutePathSegment();
AbsoluteArcPath.prototype.constructor=AbsoluteArcPath;
AbsoluteArcPath.superclass=AbsolutePathSegment.prototype;
function AbsoluteArcPath(params,owner,previous){if(arguments.length>0){this.init("A",params,owner,previous);}}
AbsoluteArcPath.prototype.init=function(command,params,owner,previous){var point=new Array();var y=params.pop();var x=params.pop();point.push(x,y);AbsoluteArcPath.superclass.init.call(this,command,point,owner,previous);this.rx=parseFloat(params.shift());this.ry=parseFloat(params.shift());this.angle=parseFloat(params.shift());this.arcFlag=parseFloat(params.shift());this.sweepFlag=parseFloat(params.shift());};
AbsoluteArcPath.prototype.toString=function(){var points=new Array();var command="";if(this.previous.constructor!=this.constuctor)command=this.command;return command+[this.rx,this.ry,this.angle,this.arcFlag,this.sweepFlag,this.handles[0].point.toString()].join(",");};
AbsoluteArcPath.prototype.getIntersectionParams=function(){return new IntersectionParams("Ellipse",[this.getCenter(),this.rx,this.ry]);};
AbsoluteArcPath.prototype.getCenter=function(){var startPoint=this.previous.getLastPoint();var endPoint=this.handles[0].point;var rx=this.rx;var ry=this.ry;var angle=this.angle*Math.PI/180;var c=Math.cos(angle);var s=Math.sin(angle);var TOLERANCE=1e-6;var halfDiff=startPoint.subtract(endPoint).divide(2);var x1p=halfDiff.x*c+halfDiff.y*s;var y1p=halfDiff.x*-s+halfDiff.y*c;var x1px1p=x1p*x1p;var y1py1p=y1p*y1p;var lambda=(x1px1p/ (rx*rx) ) + ( y1py1p /(ry*ry));if(lambda>1){var factor=Math.sqrt(lambda);rx*=factor;ry*=factor;}var rxrx=rx*rx;var ryry=ry*ry;var rxy1=rxrx*y1py1p;var ryx1=ryry*x1px1p;var factor=(rxrx*ryry-rxy1-ryx1)/(rxy1+ryx1);if(Math.abs(factor)<TOLERANCE)factor=0;var sq=Math.sqrt(factor);if(this.arcFlag==this.sweepFlag)sq=-sq;var mid=startPoint.add(endPoint).divide(2);var cxp=sq*rx*y1p/ry;var cyp=sq*-ry*x1p/rx;return new Point2D(cxp*c-cyp*s+mid.x,cxp*s+cyp*c+mid.y);};
AbsoluteCurveto2.prototype=new AbsolutePathSegment();
AbsoluteCurveto2.prototype.constructor=AbsoluteCurveto2;
AbsoluteCurveto2.superclass=AbsolutePathSegment.prototype;
function AbsoluteCurveto2(params,owner,previous){if(arguments.length>0){this.init("Q",params,owner,previous);}}
AbsoluteCurveto2.prototype.getControlPoint=function(){return this.handles[0].point;};
AbsoluteCurveto2.prototype.getIntersectionParams=function(){return new IntersectionParams("Bezier2",[this.previous.getLastPoint(),this.handles[0].point,this.handles[1].point]);};
AbsoluteCurveto3.prototype=new AbsolutePathSegment();
AbsoluteCurveto3.prototype.constructor=AbsoluteCurveto3;
AbsoluteCurveto3.superclass=AbsolutePathSegment.prototype;
function AbsoluteCurveto3(params,owner,previous){if(arguments.length>0){this.init("C",params,owner,previous);}}
AbsoluteCurveto3.prototype.getLastControlPoint=function(){return this.handles[1].point;};
AbsoluteCurveto3.prototype.getIntersectionParams=function(){return new IntersectionParams("Bezier3",[this.previous.getLastPoint(),this.handles[0].point,this.handles[1].point,this.handles[2].point]);};
AbsoluteHLineto.prototype=new AbsolutePathSegment();
AbsoluteHLineto.prototype.constructor=AbsoluteHLineto;
AbsoluteHLineto.superclass=AbsolutePathSegment.prototype;
function AbsoluteHLineto(params,owner,previous){if(arguments.length>0){this.init("H",params,owner,previous);}}
AbsoluteHLineto.prototype.init=function(command,params,owner,previous){var prevPoint=previous.getLastPoint();var point=new Array();point.push(params.pop(),prevPoint.y);AbsoluteHLineto.superclass.init.call(this,command,point,owner,previous);};
AbsoluteHLineto.prototype.toString=function(){var points=new Array();var command="";if(this.previous.constructor!=this.constuctor)command=this.command;return command+this.handles[0].point.x;};
AbsoluteLineto.prototype=new AbsolutePathSegment();
AbsoluteLineto.prototype.constructor=AbsoluteLineto;
AbsoluteLineto.superclass=AbsolutePathSegment.prototype;
function AbsoluteLineto(params,owner,previous){if(arguments.length>0){this.init("L",params,owner,previous);}}
AbsoluteLineto.prototype.toString=function(){var points=new Array();var command="";if(this.previous.constructor!=this.constuctor)if(this.previous.constructor!=AbsoluteMoveto)command=this.command;return command+this.handles[0].point.toString();};
AbsoluteLineto.prototype.getIntersectionParams=function(){return new IntersectionParams("Line",[this.previous.getLastPoint(),this.handles[0].point]);};
AbsoluteMoveto.prototype=new AbsolutePathSegment();
AbsoluteMoveto.prototype.constructor=AbsoluteMoveto;
AbsoluteMoveto.superclass=AbsolutePathSegment.prototype;
function AbsoluteMoveto(params,owner,previous){if(arguments.length>0){this.init("M",params,owner,previous);}}
AbsoluteMoveto.prototype.toString=function(){return"M"+this.handles[0].point.toString();};
AbsoluteSmoothCurveto2.prototype=new AbsolutePathSegment();
AbsoluteSmoothCurveto2.prototype.constructor=AbsoluteSmoothCurveto2;
AbsoluteSmoothCurveto2.superclass=AbsolutePathSegment.prototype;
function AbsoluteSmoothCurveto2(params,owner,previous){if(arguments.length>0){this.init("T",params,owner,previous);}}
AbsoluteSmoothCurveto2.prototype.getControlPoint=function(){var lastPoint=this.previous.getLastPoint();var point;if(this.previous.command.match(/^[QqTt]$/)){var ctrlPoint=this.previous.getControlPoint();var diff=ctrlPoint.subtract(lastPoint);point=lastPoint.subtract(diff);}else{point=lastPoint;}return point;};
AbsoluteSmoothCurveto2.prototype.getIntersectionParams=function(){return new IntersectionParams("Bezier2",[this.previous.getLastPoint(),this.getControlPoint(),this.handles[0].point]);};
AbsoluteSmoothCurveto3.prototype=new AbsolutePathSegment();
AbsoluteSmoothCurveto3.prototype.constructor=AbsoluteSmoothCurveto3;
AbsoluteSmoothCurveto3.superclass=AbsolutePathSegment.prototype;
function AbsoluteSmoothCurveto3(params,owner,previous){if(arguments.length>0){this.init("S",params,owner,previous);}}
AbsoluteSmoothCurveto3.prototype.getFirstControlPoint=function(){var lastPoint=this.previous.getLastPoint();var point;if(this.previous.command.match(/^[SsCc]$/)){var lastControl=this.previous.getLastControlPoint();var diff=lastControl.subtract(lastPoint);point=lastPoint.subtract(diff);}else{point=lastPoint;}return point;};
AbsoluteSmoothCurveto3.prototype.getLastControlPoint=function(){return this.handles[0].point;};
AbsoluteSmoothCurveto3.prototype.getIntersectionParams=function(){return new IntersectionParams("Bezier3",[this.previous.getLastPoint(),this.getFirstControlPoint(),this.handles[0].point,this.handles[1].point]);};
RelativePathSegment.prototype=new AbsolutePathSegment();
RelativePathSegment.prototype.constructor=RelativePathSegment;
RelativePathSegment.superclass=AbsolutePathSegment.prototype;
function RelativePathSegment(command,params,owner,previous){if(arguments.length>0)this.init(command,params,owner,previous);}
RelativePathSegment.prototype.init=function(command,params,owner,previous){this.command=command;this.owner=owner;this.previous=previous;this.handles=new Array();var lastPoint;if(this.previous)lastPoint=this.previous.getLastPoint();else lastPoint=new Point2D(0,0);var index=0;while(index<params.length){var handle=new Handle(lastPoint.x+params[index],lastPoint.y+params[index+1],owner);this.handles.push(handle);index+=2;}};
RelativePathSegment.prototype.toString=function(){var points=new Array();var command="";var lastPoint;if(this.previous)lastPoint=this.previous.getLastPoint();else lastPoint=new Point2D(0,0);if(this.previous==null||this.previous.constructor!=this.constructor)command=this.command;for(var i=0;i<this.handles.length;i++){var point=this.handles[i].point.subtract(lastPoint);points.push(point.toString());}return command+points.join(" ");};
RelativeClosePath.prototype=new RelativePathSegment();
RelativeClosePath.prototype.constructor=RelativeClosePath;
RelativeClosePath.superclass=RelativePathSegment.prototype;
function RelativeClosePath(params,owner,previous){if(arguments.length>0){this.init("z",params,owner,previous);}}
RelativeClosePath.prototype.getLastPoint=function(){var current=this.previous;var point;while(current){if(current.command.match(/^[mMzZ]$/)){point=current.getLastPoint();break;}current=current.previous;}return point;};
RelativeClosePath.prototype.getIntersectionParams=function(){return new IntersectionParams("Line",[this.previous.getLastPoint(),this.getLastPoint()]);};
RelativeCurveto2.prototype=new RelativePathSegment();
RelativeCurveto2.prototype.constructor=RelativeCurveto2;
RelativeCurveto2.superclass=RelativePathSegment.prototype;
function RelativeCurveto2(params,owner,previous){if(arguments.length>0){this.init("q",params,owner,previous);}}
RelativeCurveto2.prototype.getControlPoint=function(){return this.handles[0].point;};
RelativeCurveto2.prototype.getIntersectionParams=function(){return new IntersectionParams("Bezier2",[this.previous.getLastPoint(),this.handles[0].point,this.handles[1].point]);};
RelativeCurveto3.prototype=new RelativePathSegment();
RelativeCurveto3.prototype.constructor=RelativeCurveto3;
RelativeCurveto3.superclass=RelativePathSegment.prototype;
function RelativeCurveto3(params,owner,previous){if(arguments.length>0){this.init("c",params,owner,previous);}}
RelativeCurveto3.prototype.getLastControlPoint=function(){return this.handles[1].point;};
RelativeCurveto3.prototype.getIntersectionParams=function(){return new IntersectionParams("Bezier3",[this.previous.getLastPoint(),this.handles[0].point,this.handles[1].point,this.handles[2].point]);};
RelativeLineto.prototype=new RelativePathSegment();
RelativeLineto.prototype.constructor=RelativeLineto;
RelativeLineto.superclass=RelativePathSegment.prototype;
function RelativeLineto(params,owner,previous){if(arguments.length>0){this.init("l",params,owner,previous);}}
RelativeLineto.prototype.toString=function(){var points=new Array();var command="";var lastPoint;var point;if(this.previous)lastPoint=this.previous.getLastPoint();else lastPoint=new Point(0,0);point=this.handles[0].point.subtract(lastPoint);if(this.previous.constructor!=this.constuctor)if(this.previous.constructor!=RelativeMoveto)cmd=this.command;return cmd+point.toString();};
RelativeLineto.prototype.getIntersectionParams=function(){return new IntersectionParams("Line",[this.previous.getLastPoint(),this.handles[0].point]);};
RelativeMoveto.prototype=new RelativePathSegment();
RelativeMoveto.prototype.constructor=RelativeMoveto;
RelativeMoveto.superclass=RelativePathSegment.prototype;
function RelativeMoveto(params,owner,previous){if(arguments.length>0){this.init("m",params,owner,previous);}}
RelativeMoveto.prototype.toString=function(){return"m"+this.handles[0].point.toString();};
RelativeSmoothCurveto2.prototype=new RelativePathSegment();
RelativeSmoothCurveto2.prototype.constructor=RelativeSmoothCurveto2;
RelativeSmoothCurveto2.superclass=RelativePathSegment.prototype;
function RelativeSmoothCurveto2(params,owner,previous){if(arguments.length>0){this.init("t",params,owner,previous);}}
RelativeSmoothCurveto2.prototype.getControlPoint=function(){var lastPoint=this.previous.getLastPoint();var point;if(this.previous.command.match(/^[QqTt]$/)){var ctrlPoint=this.previous.getControlPoint();var diff=ctrlPoint.subtract(lastPoint);point=lastPoint.subtract(diff);}else{point=lastPoint;}return point;};
RelativeSmoothCurveto2.prototype.getIntersectionParams=function(){return new IntersectionParams("Bezier2",[this.previous.getLastPoint(),this.getControlPoint(),this.handles[0].point]);};
RelativeSmoothCurveto3.prototype=new RelativePathSegment();
RelativeSmoothCurveto3.prototype.constructor=RelativeSmoothCurveto3;
RelativeSmoothCurveto3.superclass=RelativePathSegment.prototype;
function RelativeSmoothCurveto3(params,owner,previous){if(arguments.length>0){this.init("s",params,owner,previous);}}
RelativeSmoothCurveto3.prototype.getFirstControlPoint=function(){var lastPoint=this.previous.getLastPoint();var point;if(this.previous.command.match(/^[SsCc]$/)){var lastControl=this.previous.getLastControlPoint();var diff=lastControl.subtract(lastPoint);point=lastPoint.subtract(diff);}else{point=lastPoint;}return point;};
RelativeSmoothCurveto3.prototype.getLastControlPoint=function(){return this.handles[0].point;};
RelativeSmoothCurveto3.prototype.getIntersectionParams=function(){return new IntersectionParams("Bezier3",[this.previous.getLastPoint(),this.getFirstControlPoint(),this.handles[0].point,this.handles[1].point]);};
Polygon.prototype=new Shape();
Polygon.prototype.constructor=Polygon;
Polygon.superclass=Shape.prototype;
function Polygon(svgNode){if(arguments.length>0){this.init(svgNode);}}
Polygon.prototype.init=function(svgNode){if(svgNode.localName=="polygon"){Polygon.superclass.init.call(this,svgNode);var points=svgNode.getAttributeNS(null,"points").split(/[\s,]+/);this.handles=new Array();for(var i=0;i<points.length;i+=2){var x=parseFloat(points[i]);var y=parseFloat(points[i+1]);this.handles.push(new Handle(x,y,this));}}else{throw new Error("Polygon.init: Invalid SVG Node: "+svgNode.localName);}};
Polygon.prototype.realize=function(){if(this.svgNode!=null){for(var i=0;i<this.handles.length;i++){this.handles[i].realize();this.handles[i].show(false);}this.svgNode.addEventListener("mousedown",this,false);}};
Polygon.prototype.refresh=function(){var points=new Array();for(var i=0;i<this.handles.length;i++){points.push(this.handles[i].point.toString());}this.svgNode.setAttributeNS(null,"points",points.join(" "));};
Polygon.prototype.registerHandles=function(){for(var i=0;i<this.handles.length;i++)mouser.register(this.handles[i]);};
Polygon.prototype.unregisterHandles=function(){for(var i=0;i<this.handles.length;i++)mouser.unregister(this.handles[i]);};
Polygon.prototype.selectHandles=function(select){for(var i=0;i<this.handles.length;i++)this.handles[i].select(select);};
Polygon.prototype.showHandles=function(state){for(var i=0;i<this.handles.length;i++)this.handles[i].show(state);};
Polygon.prototype.pointInPolygon=function(point){var length=this.handles.length;var counter=0;var x_inter;var p1=this.handles[0].point;for(var i=1;i<=length;i++){var p2=this.handles[i%length].point;if(point.y>Math.min(p1.y,p2.y)){if(point.y<=Math.max(p1.y,p2.y)){if(point.x<=Math.max(p1.x,p2.x)){if(p1.y!=p2.y){x_inter=(point.y-p1.y)*(p2.x-p1.x)/(p2.y-p1.y)+p1.x;if(p1.x==p2.x||point.x<=x_inter){counter++;}}}}}p1=p2;}return(counter%2==1);};
Polygon.prototype.getIntersectionParams=function(){var points=new Array();for(var i=0;i<this.handles.length;i++){points.push(this.handles[i].point);}return new IntersectionParams("Polygon",[points]);};
Polygon.prototype.getArea=function(){var area=0;var length=this.handles.length;var neg=0;var pos=0;for(var i=0;i<length;i++){var h1=this.handles[i].point;var h2=this.handles[(i+1)%length].point;area+=(h1.x*h2.y-h2.x*h1.y);}return area/2;};
Polygon.prototype.getCentroid=function(){var length=this.handles.length;var area6x=6*this.getArea();var x_sum=0;var y_sum=0;for(var i=0;i<length;i++){var p1=this.handles[i].point;var p2=this.handles[(i+1)%length].point;var cross=(p1.x*p2.y-p2.x*p1.y);x_sum+=(p1.x+p2.x)*cross;y_sum+=(p1.y+p2.y)*cross;}return new Point2D(x_sum/ area6x, y_sum /area6x);};
Polygon.prototype.isClockwise=function(){return this.getArea()<0;};
Polygon.prototype.isCounterClockwise=function(){return this.getArea()>0;};
Polygon.prototype.isConcave=function(){var positive=0;var negative=0;var length=this.handles.length;for(var i=0;i<length;i++){var p0=this.handles[i].point;var p1=this.handles[(i+1)%length].point;var p2=this.handles[(i+2)%length].point;var v0=Vector2D.fromPoints(p0,p1);var v1=Vector2D.fromPoints(p1,p2);var cross=v0.cross(v1);if(cross<0){negative++;}else{positive++;}}return(negative!=0&&positive!=0);};
Polygon.prototype.isConvex=function(){return!this.isConcave();};
Rectangle.prototype=new Shape();
Rectangle.prototype.constructor=Rectangle;
Rectangle.superclass=Shape.prototype;
function Rectangle(svgNode){if(arguments.length>0){this.init(svgNode);}}
Rectangle.prototype.init=function(svgNode){if(svgNode.localName=="rect"){Rectangle.superclass.init.call(this,svgNode);var x=parseFloat(svgNode.getAttributeNS(null,"x"));var y=parseFloat(svgNode.getAttributeNS(null,"y"));var width=parseFloat(svgNode.getAttributeNS(null,"width"));var height=parseFloat(svgNode.getAttributeNS(null,"height"));this.p1=new Handle(x,y,this);this.p2=new Handle(x+width,y+height,this);}else{throw new Error("Rectangle.init: Invalid SVG Node: "+svgNode.localName);}};
Rectangle.prototype.realize=function(){if(this.svgNode!=null){this.p1.realize();this.p2.realize();this.p1.show(false);this.p2.show(false);this.svgNode.addEventListener("mousedown",this,false);}};
Rectangle.prototype.refresh=function(){var min=this.p1.point.min(this.p2.point);var max=this.p1.point.max(this.p2.point);this.svgNode.setAttributeNS(null,"x",min.x);this.svgNode.setAttributeNS(null,"y",min.y);this.svgNode.setAttributeNS(null,"width",max.x-min.x);this.svgNode.setAttributeNS(null,"height",max.y-min.y);};
Rectangle.prototype.registerHandles=function(){mouser.register(this.p1);mouser.register(this.p2);};
Rectangle.prototype.unregisterHandles=function(){mouser.unregister(this.p1);mouser.unregister(this.p2);};
Rectangle.prototype.selectHandles=function(select){this.p1.select(select);this.p2.select(select);};
Rectangle.prototype.showHandles=function(state){this.p1.show(state);this.p2.show(state);};
Rectangle.prototype.getIntersectionParams=function(){return new IntersectionParams("Rectangle",[this.p1.point,this.p2.point]);};

/*! Copyright (c) 2011 Brandon Aaron (http://brandonaaron.net)
 * Licensed under the MIT License (LICENSE.txt).
 *
 * Thanks to: http://adomas.org/javascript-mouse-wheel/ for some pointers.
 * Thanks to: Mathias Bank(http://www.mathias-bank.de) for a scope bug fix.
 * Thanks to: Seamus Leahy for adding deltaX and deltaY
 *
 * Version: 3.0.6
 * 
 * Requires: 1.2.2+
 */

(function($) {

var types = ['DOMMouseScroll', 'mousewheel'];

if ($.event.fixHooks) {
    for ( var i=types.length; i; ) {
        $.event.fixHooks[ types[--i] ] = $.event.mouseHooks;
    }
}

$.event.special.mousewheel = {
    setup: function() {
        if ( this.addEventListener ) {
            for ( var i=types.length; i; ) {
                this.addEventListener( types[--i], handler, false );
            }
        } else {
            this.onmousewheel = handler;
        }
    },
    
    teardown: function() {
        if ( this.removeEventListener ) {
            for ( var i=types.length; i; ) {
                this.removeEventListener( types[--i], handler, false );
            }
        } else {
            this.onmousewheel = null;
        }
    }
};

$.fn.extend({
    mousewheel: function(fn) {
        return fn ? this.bind("mousewheel", fn) : this.trigger("mousewheel");
    },
    
    unmousewheel: function(fn) {
        return this.unbind("mousewheel", fn);
    }
});


function handler(event) {
    var orgEvent = event || window.event, args = [].slice.call( arguments, 1 ), delta = 0, returnValue = true, deltaX = 0, deltaY = 0;
    event = $.event.fix(orgEvent);
    event.type = "mousewheel";
    
    // Old school scrollwheel delta
    if ( orgEvent.wheelDelta ) { delta = orgEvent.wheelDelta/120; }
    if ( orgEvent.detail     ) { delta = -orgEvent.detail/3; }
    
    // New school multidimensional scroll (touchpads) deltas
    deltaY = delta;
    
    // Gecko
    if ( orgEvent.axis !== undefined && orgEvent.axis === orgEvent.HORIZONTAL_AXIS ) {
        deltaY = 0;
        deltaX = -1*delta;
    }
    
    // Webkit
    if ( orgEvent.wheelDeltaY !== undefined ) { deltaY = orgEvent.wheelDeltaY/120; }
    if ( orgEvent.wheelDeltaX !== undefined ) { deltaX = -1*orgEvent.wheelDeltaX/120; }
    
    // Add event and delta to the front of the arguments
    args.unshift(event, delta, deltaX, deltaY);
    
    return ($.event.dispatch || $.event.handle).apply(this, args);
}

})(jQuery);
