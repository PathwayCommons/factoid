(function($) {
	function ok(type){
		return window.console && window.console.log && ( type == null ? true : enabled[type] );
	}
	
	$.log = function() {
		if (ok("log")) {
			console.log.apply(window.console, arguments);
		}
	};
	
	$.console = {};
	
	var hookedList = {};
	
	function name2fn(name){
		var names = name.split(".");
		
		var func = window;
		$.each(names, function(i, n){
			func = func[n];
		});
		
		return func;
	}
	
	function reassign(name, fn){
		eval("window." + name + " = fn;");
	}
	
	function hooked(name){
		var fn = name2fn(name);
		
		hookedList[name] = fn;
	}
	
	function unhooked(name){
		hookedList[name] = null;
	}
	
	function fn(name){
		return hookedList[name];
	}
	
	function have(name){
		return hookedList[name] != null;
	}
	
	$.console.unhook = function(name){
		
		var func = name2fn(name);
		
		if( typeof func == typeof {} ){
			var obj = func;
			
			for(var var_name in obj){
				if( typeof obj[var_name] == typeof function(){} ){
					$.console.unhook(name + "." + var_name);
				}
			}
			return;
		} else if( !$.isFunction(func) ){
			return;
		} else if( have(name) ){
			reassign(name, fn(name));
			unhooked(name);
		}
		
		
	};

	
	$.console.hook = function(name){
		
		var func = name2fn(name);
		
		if( typeof func == typeof {} ){
		
			var obj = func;
			for(var var_name in obj){
				if( typeof obj[var_name] == typeof function(){} ){
					$.console.hook(name + "." + var_name);
				}
			}
			return;
		
		} else if( !$.isFunction(func) ){
			
			return;
		
		} else if( !have(name) ){
			
			hooked(name);
			
			reassign(name, function(){
				if( ok("call") ){
					if( console.groupCollapsed != null ){
						console.groupCollapsed("Call %s", name);
					} else {
						console.log("Call %s", name);
					}
					
					console.log("with arguments %o", arguments);
					
					if( console.groupEnd != null ){
						console.groupEnd();
					}
				}
				
				var ret = func.apply(func, arguments);
				return ret;
			});
		}
	};
	
	$.console.enable = function(type){
		
		if( type == null ){
			for(var i in enabled){
				enabled[i] = true;
			}
			return;
		}
		
		enabled[type] = true;
	};
	
	$.console.only = function(type){
		$.console.disable();
		$.console.enable(type);
	};
	
	$.console.disable = function(type){
		if(type == null){
			for(var i in enabled){
				enabled[i] = false;
			}
			return;
		}
		
		enabled[type] = false;
	};
	
	$.fn.console = {};	
	var fns = ["debug", "info", "log", "warn", "error", "assert", "group", "groupCollapsed", "groupEnd", "trace"];
	
	var enabled = { call: true };
	
	$.each(fns, function(i, fnName){
	
		enabled[fnName] = true;
		
		$.console[fnName] = function() {
			if (ok(fnName)) {
				var log = Function.prototype.bind.call(console[fnName], console);
				log.apply(console, arguments);
			}
		};
		
		$.fn.console[fnName] = function() {
			$.console[fnName](this);
			return this;
		}
	});
	
	$.fn.log = function() {
		$.log(this);
		return this;
	}
})(jQuery);