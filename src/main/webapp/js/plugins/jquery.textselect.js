;(function($){
	
	var defaults = {
		string: "",
		matches: [],
		add: function(text){},
		addstart: function(){},
		addstop: function(text){},
		changestart: function(text){},
		changestop: function(text){},
		change: function(oldText, newText){},
		remove: function(text){},
		click: function(text){},
		cursorAttributes: {},
		closeAttributes: {}
	};
	
	var classes = {
		selected: "ui-state-selected",
		unselected: "ui-state-unselected",
		match: "ui-textselect-match",
		cursor: "ui-textselect-cursor",
		lcursor: "ui-textselect-cursor-left",
		rcursor: "ui-textselect-cursor-right",
		cursortop: "ui-textselect-cursor-top",
		cursorbottom: "ui-textselect-cursor-bottom",
		text: "ui-textselect-text",
		parent: "ui-textselect",
		highlight: "ui-textselect-highlight",
		close: "ui-textselect-close",
		closeicon: "ui-textselect-close-icon",
		filler: "ui-textselect-filler"
	}
	
	function cls(name){
		if( name.charAt(0) == "." ){
			name = name.substring(1);
			return "." + classes[name];
		} else {
			return classes[name];
		}
	}
	
	var boundLive = false;
	var mousedown = false;
	var mousedragged = false;
	var closeTimeout;
	var $activeMatch = null;
	var $lastMatch = null;
	
	$.fn.textselect = function(opts){
		var $self = $(this);
		var options = $.extend({}, defaults, opts);

		if( typeof opts == typeof "" ){
			var command = opts.toLowerCase();
			var silent = false;
			
			switch(command){
			case "silentremove":
				silent = true;
			case "remove":
				$self.each(function(){
					deleteMatch( $(this), silent );
				});	
				break;
			case "silentstring":
				silent = true;
			case "string":
				makeMatchFromString( $(this), arguments[1], silent );
				break;
			case "silentadd":
				silent = true;
			case "add":
				makeMatchFromElement( $(this), silent );
				break;
			}		
			
			return $(this);
		}
		
		$self.addClass( cls("parent") );
		$self.data("textselectoptions", options);
		
		var $cursors = $(cls(".cursor"));
		var createCursors = $cursors.size() == 0;
		
		if( createCursors ){
			$.each(["lcursor", "rcursor"], function(i, curCls){
				var $cursor = $('<div class="'+ cls("cursor") + " " + cls(curCls) +'"></div>');
				$cursor.append('<div class="'+ cls("cursortop") +'"></div>');
				$cursor.append('<div class="'+ cls("cursorbottom") +'"></div>');
				$cursor.hide();
				
				$.each(options.cursorAttributes, function(k, v){
					$cursor.attr(k, v);
				});
				
				$("body").append($cursor);
			});
		}
		
		var $cursors = $(cls(".cursor"));
		var $lcursor = $( cls(".lcursor") );
		var $rcursor = $( cls(".rcursor") );
		
		function showCursors(){
			$cursors.show();
		}
		
		function hideCursors(){
			if( !(mousedown && $activeMatch != null) ){
				$cursors.hide();
			}
		}
		
		if( createCursors ){
			$cursors.bind("mousedown", function(e){
				if( $activeMatch != null ){
					$activeMatch.trigger(e);
				}
			}).bind("mouseout", function(e){
				hideCursors();
			});
		}
		
		var $close = $( cls(".close") );
		var createClose = $close.size() == 0;
		if( createClose ){
			var $c = $('<div class="' + cls("close") + '"><div class="' + cls("closeicon") + '"></div></div>');
			$("body").append($c);
			$c.hide();
		}
		var $close = $( cls(".close") );
		
		$.each(options.closeAttributes, function(k, v){
			$close.attr(k, v);
		});
		
		if( createClose ){
			$close.bind("mouseover", function(){
				showClose();
			}).bind("mouseout", function(){
				fadeoutClose();
			}).bind("click", function(){
				hideClose();
				if( $lastMatch != null ){
					deleteMatch( $lastMatch );
				}
			});
		}
		
		function showClose(){
			clearTimeout(closeTimeout);
			$close.stop(true);
			$close.css("opacity", 1);
			$close.show();
		}
		
		function fadeoutClose(){
			clearTimeout(closeTimeout);
			$close.stop(true);
			$close.css("opacity", 1);
			closeTimeout = setTimeout(function(){
				$close.fadeOut(500, function(){
					$close.css("opacity", 1);
					$close.hide();
				});
			}, 500);
		}
		
		function hideClose(){
			clearTimeout(closeTimeout);
			$close.stop(true);
			$close.css("opacity", 1);
			$close.hide();
		}
		
		function spanify(string){
			var ret = "";
			
			for(var i = 0; i < string.length; i++){
				ret += '<span>' + string.charAt(i) + '</span>';
			}
			
			return ret;
		}
		
		$self.append('<span class="' + cls("filler") + '">' + spanify(" ") + '</span>');
		
		for(var j = 0; j < options.matches.length; j++){
			var match = options.matches[j];
			var endOfPrevMatch = j == 0 ? 0 : options.matches[j - 1].end;
			
			var before = options.string.substring(endOfPrevMatch, match.start);
			var middle = options.string.substring(match.start, match.end);
			
			$self.append('<span class="' + cls("text") + '">' + spanify(before) + '</span>');
			$self.append('<span class="' + cls("match") + '" match="' + middle.toLowerCase() + '">' + spanify(middle) + '</span>');
			
			if( j == options.matches.length - 1 ){
				var after = options.string.substring(match.end);
				$self.append('<span class="' + cls("text") + '">' + spanify(after) + '</span>');
			}
		}
		
		if( options.matches.length == 0 ){
			$self.append('<span class="' + cls("text") + '">' + spanify(options.string) + '</span>');
		}
		
		function positionCloseAtMatch($match){
			var $lastSpan = $match.children(":last");
			var offset = $lastSpan.offset();
			
			$close.css({
				position: "absolute",
				left: offset.left + $lastSpan.width(),
				top: offset.top + $lastSpan.height() / 2
			});
			
			showClose();
		}
		
		// whether cursor should be positioned left or right
		var lastCursorPosition;
		function getCursorPosition(e){
			
			if( e == null ){
				return lastCursorPosition;
			}
			
			var x = e.pageX;
			var y = e.pageY;
			
			var $span = $(e.target);
			var $match = $span.parent( cls(".match") );
			var $firstSpan = $match.children(":first");
			var $lastSpan = $match.children(":last");
			
			while( $firstSpan.width() == 0 ){
				$firstSpan = $firstSpan.next();
			}
			
			while( $lastSpan.width() == 0 ){
				$lastSpan = $lastSpan.prev();
			}
			
			var totalWidth = 0;
			$match.children().each(function(){
				totalWidth += $(this).width();
			});
			
			var $firstSpanOnLine = null;
			$match.children().each(function(i){
				if( i <= $span.index() && $firstSpanOnLine == null && $(this).offset().top == $span.offset().top ){
					$firstSpanOnLine = $(this);
				}
			});
			var width = x - $firstSpanOnLine.offset().left;
			
			$firstSpanOnLine.prevAll().each(function(){
				width += $(this).width();
			});
			
			if( $firstSpan.offset().top != $lastSpan.offset().top ){
				if( $firstSpan.offset().top == $span.offset().top ){
					lastCursorPosition = "left";
					return "left";
				} else if( $lastSpan.offset().top == $span.offset().top ){
					lastCursorPosition = "right";
					return "right";
				}
			}
			
			if( width > totalWidth/2 ){
				lastCursorPosition = "right";
				return "right";
			} else {
				lastCursorPosition = "left";
				return "left";
			}
		}
		
		function positionCursorsOnSelection($sentence, $match){
			var $selected = $sentence.find( cls(".selected") );
			var $unselected = $sentence.find( cls(".unselected") );
			var position = getCursorPosition();
			
			if( position == "left" ){
				if( $unselected.size() == 0 ){
					if( $selected.size() == 0 ){
						$leftSpan = $match.children(":first");
					} else {
						$leftSpan = $selected.filter(":first");
					}
				} else {
					$leftSpan = $unselected.filter(":last").next();
				} 
				
				$rightSpan = $match.children(":last");
			} else if( position == "right" ){
				$leftSpan = $match.children(":first");
				
				if( $unselected.size() == 0 ){
					if( $selected.size() == 0 ){
						$rightSpan = $match.children(":last");
					} else {
						$rightSpan = $selected.filter(":last");
					}
				} else {
					$rightSpan = $unselected.filter(":first").prev();
				}
			}
			
			positionLcursorAtSpan( $leftSpan );
			positionRcursorAtSpan( $rightSpan );
		}
		
		function positionLcursorAtSpan($span){
			// skip newlines etc
			while( $span.width() == 0 ){
				$span = $span.next();
			}
			
			var offset = $span.offset();
			var left = offset.left - $lcursor.width();
			var top = offset.top + $span.height()/2;
			
			var cLeft = $lcursor.offset().left;
			var cTop =  $lcursor.offset().top;
			
			if( cLeft != left || cTop != top ){
				$lcursor.css({
					position: "absolute",
					left: left,
					top: top
				});
			}
			
			$lcursor.show();
		}
		
		function positionRcursorAtSpan($span){
			while( $span.width() == 0 ){
				$span = $span.prev();
			}
			
			offset = $span.offset();
			$rcursor.css({
				position: "absolute",
				left: offset.left + $span.width(),
				top: offset.top + $span.height()/2
			}).show();
		}
		
		function positionCursorsAtMatch($match, event){
			var position = getCursorPosition(event);
			
			var $firstSpan = $match.find("span:first");
			positionLcursorAtSpan( $firstSpan );
			
			var $lastSpan = $match.find("span:last");
			positionRcursorAtSpan( $lastSpan );
			
			$cursors.removeClass( cls("selected") );
			if( position == "left" ){
				$lcursor.addClass( cls("selected") );
			} else {
				$rcursor.addClass( cls("selected") );
			}
		}
		
		function select($target, direction){
			$target.addClass( cls("selected") ).removeClass( cls("unselected") ).attr("type", direction);
		}
		
		function unselect($target, direction){
			$target.addClass( cls("unselected") ).removeClass( cls("selected") ).attr("type", direction);
		}
		
		function reset($target){
			$target.removeClass( cls("unselected") ).removeClass( cls("selected") ).removeAttr("type");
		}
		
		function clearSelection(){
			var sel = window.getSelection();
			
			if( sel.empty != null ){
				sel.empty()
			}
		}
		
		function getOptions($element){
			if( $element.hasClass(cls("parent")) ){
				return $element.data("textselectoptions");
			} else {
				return $element.parents(cls(".parent") + ":first").data("textselectoptions");
			}
		}
		
		function trigger(fn, $match, args){
			if( $.isFunction(fn) ){
				fn.apply($match[0], args);
			}
		}
		
		function deleteMatch($match, silent){
			var $text = $('<span class="' + cls("text") + '"></span>');
			var options = getOptions($match);
    		var $spans = $match.children();
			
    		var $before = $match.prev();
    		var $after = $match.next();
    		$match.after($text);
    		
    		var beforeIsFiller = $before.hasClass(cls("filler"));
    		
    		if( !beforeIsFiller ){
    			$text.append( $before.children().remove() );
    		}

    		$text.append( $match.children().remove() );
    		$text.append( $after.children().remove() );
    		
    		if( !beforeIsFiller ){
    			$before.remove();
    		}
    		
    		$match.remove();
    		$after.remove();
    		
    		if( !silent ){
    			trigger(options.remove, $match, [$match.attr("match"), $spans]);
    		}
		}
		
		function makeMatchFromString($root, str, silent){
			
			var $texts = $root.find( cls("text") );
			console.log( $texts );
			
		}
		
		function makeMatchFromElement( $spans, silent ){
			var $text = $spans.parent();
			
			$spans.addClass( cls("selected") );
			makeMatchFromSelectionOnText( $text, silent );
		}
		
		function makeMatchFromSelectionOnText($text, silent){
			var $selected = $text.find( cls(".selected") );
			var selectedFirst = $selected.filter(":first").index();
			var selectedLast = $selected.filter(":last").index();
			var $before = $text.children().slice(0, selectedFirst);
			var $after = $text.children().slice(selectedLast + 1);
			var options = getOptions($text);
			
			if( $selected.size() > 0 ){
				$match = $('<span class="'+ cls("match") +'"></span>');
				$text.after($match);
				
				$selected.removeClass( cls("selected") ).remove();
				$match.append($selected);
				
				if( $after.size() > 0 ){
					var $afterText = $('<span class="' + cls("text") + '"></span>');
					$match.after($afterText);
					$afterText.append( $after.remove() );
				}
				
				var $beforeText = $text;
				$match.attr("match", $match.text().toLowerCase());
				
				if( $beforeText.children().size() == 0 && $beforeText.prev().size() != 0 ){
					$beforeText.remove();
				}
				
				mergeAdjacentMatches( $match );
				
				if( !silent ){
					trigger(options.addstop, $match, [$match.attr("match")]);
					trigger(options.add, $match, [$match.attr("match")]);
				}
			} else {
				if( !silent ){
					trigger(options.addstop, $text, []);
				}
			}
		}
		
		function mergeAdjacentMatches($match){
			var $beforeMatch = $match.prev( cls(".match") );
			var $afterMatch = $match.next( cls(".match") );
			
			if( $beforeMatch.size() > 0 ){
				$match.prepend( $beforeMatch.children().remove() );
				$beforeMatch.remove();
			}
			
			if( $afterMatch.size() > 0 ){
				$match.append( $afterMatch.children().remove() );
				$afterMatch.remove();
			}
			
			$match.attr("match", $match.text().toLowerCase());
		}
		
		// prevent text from being drag copied when a selection is already made
		$self.bind("dragstart", function(e){
			e.preventDefault();
		});
		
		if( !boundLive ){
			boundLive = true;
			
			$( cls(".text") ).live("mousedown", function(mdEvent){
				if(mdEvent.button != 0){
					return;
				}
				
				mousedown = true;
								
				var $sentence = $(this).parent();
				var $text = $(this);
				
				var firstCall = true;
				var handler = function(){
					var selection = getSelection();
					var base = $(selection.anchorNode).parent()[0];
					var extent = $(selection.focusNode).parent()[0];
					var baseParent = $(base).parent()[0];
					var extentParent = $(extent).parent()[0];
					
					if( baseParent == extentParent ){
						var start = $(base).index();
						var end = $(extent).index();
						
						if( firstCall ){
							firstCall = false;
							var options = getOptions($(baseParent));
				    		trigger(options.addstart, $(baseParent), []);
						}
						
						reset( $(extentParent).children() );
						
						if( start < end ){
							select( $(extentParent).children().slice(start, end + 1) );
						} else if( start == end ){
							return;
						} else {
							select( $(extentParent).children().slice(end, start + 1) );
						}
					}
				};
				
				var moveTarget = window;
				var endEvents = "blur mouseup";
				var endTarget = window;
				var endHandler = function(){
					$(moveTarget).unbind("mousemove", handler);
					
					makeMatchFromSelectionOnText($text);
					$(endTarget).unbind(endEvents, endHandler);
					
					clearSelection();
					mousedown = false;
				};
				
				$(moveTarget).bind("mousemove", handler);
				$(endTarget).bind(endEvents, endHandler);
			});
			
			$( cls(".match") ).live("mousemove", function(moEvent){
				
				if( mousedown ){
					return;
				}
				
				positionCursorsAtMatch( $(this), moEvent );
				
			}).live("mouseover", function(e){
				$activeMatch = $(this);
				$lastMatch = $(this);
				positionCloseAtMatch( $(this) );
			}).live("mouseout", function(e){
				var targetIsCursor = $(e.toElement).hasClass( cls("cursor") ) || $(e.toElement).parents( cls(".cursor") ).size() > 0;
				
				if( !mousedown && !targetIsCursor ){
					hideCursors();
					$activeMatch = null;
					fadeoutClose();
				}
			}).live("mousedown", function(mdEvent){	
				if(mdEvent.button != 0){
					return;
				}
				
				mousedown = true;
				mousedragged = false;
				
				var $match = $(this);
				var $sentence = $(this).parent();
				
				switch( getCursorPosition() ){
				case "left":
				case "right":
					break;
				default:
					return; // on bad position, don't allow selection modification
				}
				
				
				var firstCall = true;
				var handler = function(mmEvent){
					mousedragged = true;
					
					$match.addClass( cls("highlight") );
					hideClose();
					
					var selection = getSelection();
					var base = $(selection.anchorNode).parent()[0];
					var extent = $(selection.focusNode).parent()[0];
					
					var baseParent = $(base).parent()[0];
					var extentParent = $(extent).parent()[0];
					var extentSelected = selection.focusOffset > 0;

					// we always start on the match, so if not (probably via some browser bug)
					// force it to the cursor position
					if( getCursorPosition() == "left" ){
						baseParent = $match[0];
						base = $match.children(":first")[0];
					} else {
						baseParent = $match[0];
						base = $match.children(":last")[0];
					}
					
					if( firstCall ){
						firstCall = false;
						var options = getOptions($match);
						trigger(options.changestart, $match, [$match.attr("match")]);
					}
										
					function spans(i, j){
						if( i == null ){
							return $(extentParent).children();
						} else {
							return $(extentParent).children().slice(i, j);
						}
					}
					
					function matchSpans(i, j){
						if( i == null ){
							return $match.children();
						} else {
							return $match.children().slice(i, j);
						}
					}
					
					function outsideMatchSpans(){
						return $match.parent().find( cls(".text") ).children();
					}
					
					
					var start = $(base).index();
					var end = $(extent).index();
					
					// shorten i.e. unselect some text in the match
					if( baseParent == extentParent ){
						
//						console.log("shorten");
						
						if( getCursorPosition() == "left" ){
							
							reset( outsideMatchSpans() );
							unselect( spans( 0, end + 1 ), "forward" );
							reset( spans( end + 1 ) );
							reset( spans( -1 ) );
							
						} else if( getCursorPosition() == "right" ){
							if( extentSelected ){
								end++;
							}
							
							end = Math.max(1, end);
							
							reset( outsideMatchSpans() );
							reset( spans( 0, end ) );
							unselect( spans( end ), "backward" );
						}
					
						positionCursorsOnSelection($sentence, $match);
						
					// extend the selection backward
					} else if( $(baseParent).prevAll().is(extentParent) ){
						
//						console.log("back");
						
						// select past previous text (i.e. match in the middle)
						if( $(baseParent).prev()[0] != extentParent ){
							extentParent = $(baseParent).prev()[0];
							extent = $(extentParent).children(":first")[0];
							end = $(extent).index();
						}
						
						if( getCursorPosition() == "left" ){
							
							if( extentSelected ){
								end++;
							}
							
							reset( matchSpans() );
							reset( spans( 0, end ) );
							select( spans( end ), "backward" );
							
						} else { // reduce selection to 1 char
							unselect( matchSpans(), "backward" );
							reset( matchSpans( 0, 1 ) );
						}
						
						positionCursorsOnSelection($sentence, $match);
					
					// extend the selection forward
					} else if( $(baseParent).nextAll().is(extentParent) ){
						
//						console.log("forward");
						
						// select past next text (i.e. match in the middle)
						if( $(baseParent).next()[0] != extentParent ){
							extentParent = $(baseParent).next()[0];
							extent = $(extentParent).children(":last")[0];
							end = $(extent).index();
						}
						
						if( getCursorPosition() == "right" ){
							reset( matchSpans() );
							select( spans( 0, end + 1 ), "forward" );
							reset( spans( end + 1 ) );
						} else { // reduce selection to 1 char
							unselect( matchSpans(), "forward" );
							reset( matchSpans( -1 ) );
						} 
						
						positionCursorsOnSelection($sentence, $match);
						
					}
				};
				
				var moveTarget = window;
				var endEvents = "blur mouseup";
				var endTarget = window;
				var endHandler = function(endEvent){
					
					var oldMatch = $match.attr("match");
					
					$(moveTarget).unbind("mousemove", handler);
					$match.removeClass( cls("highlight") );
					
					var $selected = $sentence.find( cls(".selected") ).remove();
					var $forward = $selected.filter("[type=forward]");
					var $backward = $selected.filter("[type=backward]");
					
					reset( $selected );
					$match.prepend($backward);
					$match.append($forward);
					
					var $unselected = $sentence.find( cls(".unselected") ).remove();
					var $uforward = $unselected.filter("[type=forward]");
					var $ubackward = $unselected.filter("[type=backward]");
					
					reset( $unselected );
					
					if( $uforward.size() > 0 ){
						if( $match.prev().size() == 0 ){
							$match.before('<span class="' + cls("text") + '"></span>');
						}
						$match.prev().append($uforward);
					}
					if( $match.prev().children().size() == 0 ){
						$match.prev().remove();
					}
					
					
					if( $ubackward.size() > 0 ){
						if( $match.next().size() == 0 ){
							$match.after('<span class="' + cls("text") + '"></span>');
						}
						$match.next().prepend($ubackward);
					}
					if( $match.next().children().size() == 0 ){
						$match.next().remove();
					}
					
					$match.attr("match", $match.text().toLowerCase());
					$(endTarget).unbind(endEvents, endHandler);
					clearSelection();
					mergeAdjacentMatches( $match );
					
					mousedown = false;
					hideCursors();
					
					var options = getOptions($match);
					trigger(options.changestop, $match, [oldMatch, $match.attr("match")]);
					
					if( oldMatch != $match.attr("match") ){
						trigger(options.change, $match, [oldMatch, $match.attr("match")]);
					}
				};
				
				$(moveTarget).bind("mousemove", handler);
				$(endTarget).bind(endEvents, endHandler);
			}).live("click", function(cEvent){
				var $match = $(this);
				
				if( !mousedragged ){
					showCursors();
					trigger(options.click, $match, [$match.attr("match")]);
				}
			});
			
			$( cls(".text") + " span").live("dblclick", function(){
				var $span = $(this);
				var $text = $span.parent();
				var $matchAfter = $text.next( cls(".match") );

				if( $span.text().match(/^\s+$/) ){
					return; // space isn't a word
				}
				
				if( $matchAfter.size() > 0 ){
					var $spacesAfterSpan = $span.nextAll().filter(function(){
						return !$(this).text().match(/^\w+$/);
					});
					
					if( $spacesAfterSpan.size() == 0 ){
						return;
					}
				}
				
				var $prews = $text.children().filter(function(i){
					return i < $span.index() && !$(this).text().match(/^\w+$/);
				}).filter(":last");
				var $before = $text.children().slice($prews.index() + 1, $span.index());
				
				var $postws = $text.children().filter(function(i){
					return i > $span.index() && !$(this).text().match(/^\w+$/);
				}).filter(":first");
				var $after = $text.children().slice($span.index() + 1, $postws.index());
				
				select($before);
				select($after);
				select($span);
				
				makeMatchFromSelectionOnText($text);
			});
		}
		
	};
	
})(jQuery);