;(function($){

	var timeout;
	var undo = []; // undo stack
	var redo = []; // redo queue
	var ops = {}; // name => defn
	var listeners = {}; // event => array of callbacks
	
	function trigger(event, id, options){
		if( listeners[event] != null ){
			$.each(listeners[event], function(i, callback){
				callback( id, options );
			});
		}
	}
	
	var opts = {
		dialog: function( $content ){
			var $dialog = $('<div class="ui-undo-dialog"></div>');
			$dialog.append( $content );
			
			$("body").append( $dialog );
			
			return $dialog;
		},
		
		position: function( $dialog ){
			$dialog.css({
				position: "absolute",
				left: "50%",
				marginLeft: -1/2 * $dialog.width()
			});
		},
		
		hide: function(){
			$(".ui-undo-dialog").fadeOut(250, function(){
				$(".ui-undo-dialog").remove();
			});
		},
		
		remove: function(){
			$(".ui-undo-dialog").remove();
		},
		
		undoTime: 3000
	};
	
	$.operation = {
		
		configure: function(o){
			opts = $.extend({}, opts, o);
		},
		
		bind: function( events, callback ){
			
			if( callback === undefined ){
				callback = events;
				events = "exec undo redo";
			}
			
			evts = events.split(/\s+/);
			$.each(evts, function(i, event){
				if( listeners[event] == null ){
					listeners[event] = [];
				}
				
				listeners[event].push( callback );
			});
			
		},
			
		exec: function( id, params ){
			var op = ops[id];
			
			if( op == null ){
				$.console.log("No such operation to exec with ID `%s`", id);
				return;
			}
			
			var options = $.extend( true, {}, op.defaults, params );
			
			// add op to undo stack
			undo.push({
				id: id,
				options: options
			});
			 
			// doing any undoable operation clear the redo queue
			redo = [];
			
			// exec the op
			op.exec( options );
			trigger( "exec", id, options );
			$.console.log("Executed operation `%s` with options %o", id, options);
			
			if( options.showUndo || options.showUndo === undefined ){
				opts.remove();
				
				var $content = $('<div class="ui-undo-message"></div>');
				$content.append( op.message(options) );
			
				if( opts.showLink ){
					var $link = $(' <span class="ui-undo-link">Undo</span>');
					$content.append( $link );
					
					$link.mousedown(function(){
						opts.remove();
						clearTimeout(timeout);
						$.operation.undo();
					});	
				}
				
				var $dialog = opts.dialog( $content );
				opts.position( $dialog );
				
				var delay = opts.undoTime;
				
				clearTimeout(timeout);
				timeout = setTimeout(function(){ 
					opts.hide();
				}, delay);
				
			}
		},
		
		undo: function(){
			// remove op from undo stack
			var params = undo.pop();
			var id = params.id;
			var op = ops[id];
			var options = params.options;
			
			// put op in redo queue
			redo.unshift( params );
			
			op.undo( options );
			trigger( "undo", id, options );
			$.console.log("Undid operation `%s` with options %o", id, options);
			
			// remove ui
			opts.remove();
			clearTimeout(timeout);
		},
		
		redo: function(){
			// remove op from redo queue
			var params = redo.shift();
			var id = params.id;
			var op = ops[id];
			var options = params.options;
			
			// put op in undo stack
			undo.push( params );
			
			op.exec( options );
			trigger( "redo", id, options );
			$.console.log("Redid operation `%s` with options %o", id, options);
			
			// remove ui
			opts.remove();
		},
		
		undoable: function(){
			return undo.length > 0;
		},
		
		redoable: function(){
			return redo.length > 0;
		},
		
		add: function( params ){
			ops[ params.id ] = params;
		},
		
		remove: function( id ){
			delete ops[ id ];
		},
		
		undoMessage: function(){
			if( undo.length == 0 ){
				return null;
			}
			
			var params = undo[ undo.length - 1 ];
			var id = params.id;
			var op = ops[id];
			var options = params.options;
			
			return op.message( options );
		},
		
		redoMessage: function(){
			if( redo.length == 0 ){
				return null;
			}
			
			var params = redo[ 0 ];
			var id = params.id;
			var op = ops[id];
			var options = params.options;
			
			return op.message( options );
		}
			
	};
	
})(jQuery);