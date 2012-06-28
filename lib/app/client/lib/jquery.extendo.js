/*! jQuery Extendo - v1.0.1 - 2012-06-28
* https://github.com/maxkfranz/jquery.extendo
* Copyright (c) 2012 Max Franz; Licensed LGPL */

(function( $ ){

	var defaults = {
		timeToClose: 300,
		closeOnSelect: true,
		startOpen: false,
		closeOnBgFocus: true,
		items: [],
		attrs: {},
		classes: "",
		expander: {
			content: undefined,
			attrs: {}
		},
		open: function(){},
		close: function(){}
	};

	var classes = {
		eles: {
			root: "extendo",
			expander: "extendo-expander",
			container: "extendo-container",
			item: "extendo-item"
		},
		state: {
			open: "extendo-state-open",
			closed: "extendo-state-closed",
			active: "extendo-state-active",
			hidden: "extendo-state-hidden",
			disabled: "extendo-state-disabled",
			togglable: "extendo-state-togglable"
		}
	};

	var isTouch = ('ontouchstart' in window);

	// if a function, call it to get its current value
	function flatten( arg ){
		var argIsFunction = typeof arg === typeof function(){};
		var val;

		if( argIsFunction ){
			val = arg();
		} else  {
			val = arg;
		}

		return val;
	}

	// namespace events that we bind to
	function event( e ){
		return e + ".extendo";
	}

	var events = {
		tap: isTouch ? event("touchend") : event("click"),
		tapstart: isTouch ? event("touchstart") : event("mousedown"),
		tapend: isTouch ? event("touchend") : event("mouseup")
	};

	function getRoot( $ele ){
		if( $ele.hasClass( classes.eles.root ) ){ // root
			return $ele.filter( "." + classes.eles.root );

		} else if( $ele.hasClass( classes.eles.item ) ) { // item
			return $( $ele[0] ).parents("." + classes.eles.root + ":first");
		
		} else { // assume target
			return $ele.children("." + classes.eles.root);
		}
	}

	function getTarget( $ele ){
		return getRoot( $ele ).parent();
	}

	function getData( $ele ){
		var $root = getRoot( $ele );
		var data = $root.parent().data("extendo");
		return data;
	}

	function getOptions( $ele ){
		return getData( $ele ).options;
	}

	function getItemOptions( $item ){
		return $item.data("extendo");
	}

	function fire(fn, self, args){
		var isFunction = fn != null && typeof fn === typeof function(){};
		if( isFunction ){
			return fn.apply( self, args );
		}
	}

	function open( $root ){
		var options = getOptions( $root );

		$root
			.addClass( classes.state.open )
			.removeClass( classes.state.closed )
		;

		fire( options.open, $root );
		$root.trigger("extendoopen");
	}

	function close( $root ){
		var options = getOptions( $root );

		$root
			.removeClass( classes.state.open )
			.addClass( classes.state.closed )
		;

		$root.find("." + classes.eles.item).each(function(){
			var $item = $(this);
			deactivate( $item );
		});

		fire( options.close, $root );
		$root.trigger("extendoclose");
	}

	function enable( $items ){
		$items.removeClass( classes.state.disabled );

		$items.each(function(){
			var $item = $(this);
			var ioptions = getItemOptions( $item );

			fire( ioptions.enable, $item );
			$item.trigger("extendoenable");
		});
	}

	function disable( $items ){
		$items.addClass( classes.state.disabled );

		$items.each(function(){
			var $item = $(this);
			var ioptions = getItemOptions( $item );

			fire( ioptions.disable, $item );
			$item.trigger("extendodisable");
		});
	}

	function show( $items ){
		$items.removeClass( classes.state.hidden );

		$items.each(function(){
			var $item = $(this);
			var ioptions = getItemOptions( $item );

			fire( ioptions.show, $item );
			$item.trigger("extendoshow");
		});
	}

	function hide( $items ){
		$items.addClass( classes.state.hidden );

		$items.each(function(){
			var $item = $(this);
			var ioptions = getItemOptions( $item );

			fire( ioptions.hide, $item );
			$item.trigger("extendohide");
		});
	}

	function select( $item ){
		var itemDisabled = $item.hasClass( classes.state.disabled );
		var itemTogglable = $item.hasClass( classes.state.togglable );

		if( !itemDisabled ){

			var item = getItemOptions( $item );
			var $root = getRoot( $item );
			var options = getOptions( $root );

			activate( $item );

			fire( item.select, $item );
			$item.trigger("extendoselect");

			if( itemTogglable ){
				var active = $item.hasClass(classes.state.active);
				
				fire( item.toggle, $item, [ active ] );

				if( active ){
					fire( item.toggleon, $item );
				} else {
					fire( item.toggleoff, $item );
				}

				$item.trigger("extendotoggle");
				$item.trigger( active ? "extendotoggleon" : "extendotoggleoff" );
			}

			var itemWantsToClose = flatten(item.closeOnSelect);
			var globalWantsToClose = flatten(options.closeOnSelect);
			var shouldClose;

			if( itemWantsToClose !== undefined ){
				shouldClose = itemWantsToClose;
			} else if( globalWantsToClose !== undefined ){
				shouldClose = globalWantsToClose;
			} else {
				shouldClose = defaults.closeOnSelect;
			}

			if( shouldClose ){
				setTimeout(function(){
					close( $root );
				}, flatten(options.timeToClose) );	
			} else { // we have to manually deactivate if not closing
				setTimeout(function(){
					deactivate( $item );
				}, flatten(options.timeToClose) );
			}

		} // if not disabled
	}

	function activate( $item ){
		var itemDisabled = $item.hasClass( classes.state.disabled );
		var itemTogglable = $item.hasClass( classes.state.togglable );
		var itemActive = $item.hasClass( classes.state.active );

		if( !itemDisabled ){
			if( itemTogglable ){
				if( itemActive ){
					$item.removeClass( classes.state.active );
				} else {
					$item.addClass( classes.state.active );
				}
			} else {
				$item.addClass( classes.state.active );
			}
		}
	}

	function deactivate( $item ){
		var itemDisabled = $item.hasClass( classes.state.disabled );
		var itemTogglable = $item.hasClass( classes.state.togglable );

		if( !itemDisabled && !itemTogglable ){
			$item.removeClass( classes.state.active );
		}
	}

	function defineItemFunction( callback ){
		return function( search ){
			var $this = $(this);
			var isRoot = $this.hasClass( classes.eles.root );
			var isItem = $this.hasClass( classes.eles.item );
			var isTarget = !isItem && $this.data("extendo") != null;
			var searchIsIndex = ("" + parseInt(search, 10)) === search;
			var searchIsString = typeof search === typeof "";
			var searchIsFunction = typeof search === typeof function(){};
			var args = arguments;

			function applyCallback( $items ){
				if( searchIsIndex ){
					var index = parseInt(search, 10);
					return callback.apply( $items.eq(index), args );
				} else if( searchIsString || searchIsFunction ) {
					return callback.apply( $items.filter(search), args );
				} else {
					return callback.apply( $items, args );
				}
			}

			var $items;
			if( isTarget ){
				var $root = $this.data("extendo").root;
				$items = $root.find( "." + classes.eles.item );
			} else if( isRoot ){
				$items = $this.find( "." + classes.eles.item );
			} else if( isItem ){
				$items = $this;
			}

			return applyCallback( $items );
		};
	}

	var methods = {
		init: function( options ) {

			return $(this).each(function(){
				var self = this;
				var $self = $(this);
				var data = $self.data('extendo');
				var pluginInited = data != null;
				options = $.extend( {}, defaults, options );

				if ( !pluginInited ) {

					var isOpen = function(){
						return $root.hasClass( classes.state.open );
					};

					var $root = $('<div />', flatten(options.attrs) )
						.addClass( classes.eles.root )
						.addClass( flatten(options.startOpen) ? classes.state.open : classes.state.closed )
						.addClass( flatten(options.classes) )
					;

					var $expander = $('<div />', flatten(options.expander.attrs) )
						.addClass( classes.eles.expander  )
						.appendTo( $root ).bind(events.tapstart, function(e){
							if( isOpen() ){
								close( $root );
							} else {
								open( $root );
							}

							e.preventDefault();
						})
					;

					if( options.expander.content != null ){
						$expander.html( flatten(options.expander.content) );
					}

					var $container = $('<div />', {
						"class": classes.eles.container
					}).appendTo( $root );

					$.each(options.items, function(i, item){
						var attrs = {};

						var $item = $('<div />', $.extend( attrs, flatten(item.attrs) ))
							.data( "extendo", item )
							.addClass( classes.eles.item )
							.addClass( flatten(item.classes) )
							.addClass( flatten(item.disabled) ? classes.state.disabled : "" )
							.addClass( flatten(item.hidden) ? classes.state.hidden : "" )
							.addClass( flatten(item.togglable) ? classes.state.togglable : "" )
							.appendTo( $container )
							.bind(events.tapstart, function(e){
								select( $item );

								e.preventDefault();
							})
						;

						if( item.content != null ){
							$item.append( flatten(item.content) );
						}
					}); // each

					$(window).bind(events.tapstart, function(e){
						if( flatten(options.closeOnBgFocus) ){
							var $target = $(e.target);
							var rootIsParent = $target.parents().filter(function(){
								return this === $root[0];
							}).size() > 0;
							var alreadyClosed = $root.hasClass( classes.state.closed );

							if( !rootIsParent && !alreadyClosed ){
								close( $root );
							}
						}
					});

					$self.data("extendo", {
						target : $self,
						options: options,
						root: $root
					}).append( $root );
				} // if not plugin inited
			}); // each
		},

		destroy: function(){
			return $(this).each(function(){
				var $this = $(this),
				data = $this.data('tooltip');

				$(window).unbind('.extendo');
				data.root.remove(); // destroy extendo ui
				$this.removeData('extendo'); // remove data
			});
		},

		select: defineItemFunction(function(search){
			var $items = this;
			activate( $items );
			select( $items );
		}),

		disable: defineItemFunction(function(search){
			var $items = this;
			disable( $items );
		}),

		enable: defineItemFunction(function(search){
			var $items = this;
			enable( $items );
		}),

		hide: defineItemFunction(function(search){
			var $items = this;
			hide( $items );
		}),

		show: defineItemFunction(function(search){
			var $items = this;
			show( $items );
		})
	};

	$.fn.extendo = function( method ) {

		if ( methods[method] ) {
			return methods[method].apply( this, Array.prototype.slice.call( arguments, 1 ));
		} else if ( typeof method === 'object' || ! method ) {
			return methods.init.apply( this, arguments );
		} else {
			$.error( 'Method ' +  method + ' does not exist on jQuery.extendo' );
		}    

	};

}( jQuery ));