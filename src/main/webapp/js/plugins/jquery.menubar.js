/**
 * Code written by Max Franz.
 *
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 2.1 of the License, or (at your option) any later version.
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public
 * License along with this library; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301  USA
 */

jQuery.fn.reverse = [].reverse;

;(function($){
   
    $.fn.menubar = function(options, param1) {  
        
    	if( options == "disable" ){
    		$(this).addClass("ui-state-disabled");
    		return;
    	} else if( options == "enable" ){
    		$(this).removeClass("ui-state-disabled");
    		return;
    	} else if( options == "enableall" ){
    		$(this).removeClass("ui-state-disabled");
    		$(this).find(".ui-state-disabled").removeClass("ui-state-disabled");
    		return;
    	} else if( options == "name" ){
    		$(this).find(".ui-menu-label:first").html( param1 );
    		return;
    	} else if( options == "selecton" ){
    		$(this).addClass("ui-state-active");
    		return;
    	} else if( options == "selectoff" ){
    		$(this).removeClass("ui-state-active");
    		return;
    	} else if( options == "icon" ){
    		$(this).find(".ui-icon:first").attr("class", "ui-icon " + param1);
    		return;
    	}
    	
    	function disabled(ele){
    		return $(ele).hasClass("ui-state-disabled") || $(ele).parents().hasClass("ui-state-disabled");
    	}
    	
        var defaults = {
            addArrow: true,
            titleArrowText: "<span class='ui-menu-bar-arrow'>&nbsp;&#9660;</span>",
            menuOpenDelay: 200, // in ms
            items: undefined,
            closeOnEsc: true
        };
        
        var options = $.extend(defaults, options); 
        
        var timeout;
        
        function createLevel(parent, items){
        	var ul = $('<ul></ul>');
        	
	        $.each(items, function(i, item){
	        	var li = $('<li' + ( item.checkable ? ' class="ui-menu-checkable" ' : '' ) + '></li>');
	        	var label = $("<span class='ui-menu-label'></span>");
	        	li.append(label);
	        	ul.append(li);
	        	
	        	if( item.name == null ){
	        		item.name = "&nbsp;";
	        	}
	        	
        		var name = $('<span class="ui-menu-name">' + item.name + '</span>');
        		label.append( name );
	        	
	        	
	        	if( item.icon != null ){
	        		var icon = $('<span class="ui-icon '+ item.icon +'"></span>');
	        		label.prepend( icon );
	        	}
	        	
	        	if( item.attr != null ){
		        	for(var attr_name in item.attr){
		        		li.attr(attr_name, item.attr[attr_name]);
		        	}
	        	}
	        	
	        	if( item.labelAttr != null ){
		        	for(var attr_name in item.labelAttr){
		        		label.attr(attr_name, item.labelAttr[attr_name]);
		        	}
	        	}
	        	
	        	$(li).data("item", item);
	        	
        		if( item.items != null ){
        			createLevel(li, item.items);
        		} else if( !parent.is("ul") && item.checkable ){
        			li.addClass("ui-menu-togglable");
        		} else if( !parent.is("ul") && !item.checkable ){
        			li.addClass("ui-menu-clickable");
        		}
        		
        		if( item.disabled ){
        			li.addClass("ui-state-disabled");
        		}
	        });
	        
	        parent.append(ul);
        }
        
        function trigger(li, event, params){
        	var item = $(li).data("item");
        	
        	if( item != null ){
        		var fn = item[event];
        		
        		if( fn != null ){
	        		fn(params);
	        	}
        	}
        	
        	li.trigger("menu" + event, params);
//        	console.log(event);
        }
        
        function onMenuItemSelect(li){
    		trigger(li, "hoveron");
        }
        
        function onMenuItemDeselect(li){
    		trigger(li, "hoveroff");
        }
        
        function onMenuItemOpen(li){
    		trigger(li, "open");
        }
        
        function onMenuItemClose(li){
    		trigger(li, "close");
        }
        
        function onMenuItemCheck(li){
        	trigger(li, "selecton");
        	trigger(li, "select", true);
        }
        
        function onMenuItemUncheck(li){
        	trigger(li, "selectoff");
        	trigger(li, "select", false);
        }
        
        function onMenuItemClick(li){
        	//trigger(li, "click");
        }
        
        function onMenuItemOn(li){
        		trigger(li, "selecton");
        		trigger(li, "select", true);
        }
        
        function onMenuItemOff(li){
    		trigger(li, "selectoff");
    		trigger(li, "select", false);
        }
        
        this.each(function(){
        	createLevel( $(this), options.items );
        });
        
        function openMenu(li) {
            // add selected style
            li.addClass("ui-state-active");
            
            // clicking one menu item (toggle or otherwise) closes siblings
            li.siblings("li").each(function(){
                if( $(this).hasClass("ui-state-active") && ! $(this).hasClass("ui-menu-togglable") ) {
                    $(this).click();
                }
            });
            
            li.find(".ui-menu-parent-icon").addClass("ui-state-active");
            li.children("ul").find(".ui-menu-parent-icon").removeClass("ui-state-active");
            
            li.find(".ui-menu-check-icon").addClass("ui-state-active");
            li.children("ul").find(".ui-menu-check-icon").removeClass("ui-state-active");

            
            // opening sub menu is delayed
            timeout = setTimeout(function(){
                var children = false;
                
                // open sub menus
                li.children("ul").show().each(function(){
                    
                    var maxWidth = 0;
                    var maxLabelWidth = 0;
                    
                    $(this).children("li").each(function(){
                        $(this).css("display", "block").css("width", "auto");
                        maxWidth = Math.max( maxWidth, $(this).outerWidth() );
                        maxLabelWidth = Math.max( maxLabelWidth, $(this).children(".ui-menu-label").width() );
                    }).width(maxWidth);
                    
                    $(this).children("li").children(".ui-menu-label").width(maxLabelWidth);
                    
                    $(this).css("height", $(this).height());
                    
                    if( ! $(this).parent().hasClass("ui-menu-title") ) {
                        $(this).css( "left", $(this).parent().outerWidth() );
                        $(this).css( "top", $(this).parent().position().top );
                    } else {
                        $(this).css( "top", $(this).parent().outerHeight() + $(this).parent().position().top );
                        $(this).css( "left", $(this).parent().offset().left );
                    }
                    
                    // icon offsets
                    $(this).children("li").children(".ui-menu-parent-icon" + ", ." + "ui-menu-check-icon").each(function(){
                        var offsetY = ( ( $(this).closest("li").height() - $(this).height() ) / 2 );
                        
                        if( parseInt( $(this).css("margin-top") ) == 0 ) {
                            $(this).css( "margin-top", offsetY );
                        }
                        
                        if( $(this).hasClass("ui-menu-parent-icon") ) {
                            var offsetX = $(this).closest("li").width() - $(this).width();
                            $(this).css("margin-left", offsetX);
                        }
                    });
                    
                    children = true;
                });
                
                if(children) {
                    onMenuItemOpen(li);
                }
            }, (li.hasClass("ui-menu-title") ? 0 : options.menuOpenDelay) );
        }
        
        function closeMenu(li) {
            clearTimeout(timeout);
        
            var children = li.children("ul").length > 0;
        
            li.children("ul").hide();
            
            li.removeClass("ui-state-active");
            
            li.find(".ui-menu-parent-icon").removeClass("ui-state-active");
            li.find(".ui-menu-check-icon").removeClass("ui-state-active");
            
            if( li.hasClass("ui-menu-togglable") ) {
                li.siblings("li").each(function(){
                    if( $(this).hasClass("ui-state-active") && ! $(this).hasClass("ui-menu-togglable") ) {
                        $(this).click();
                    }
                });
            }
            

            if(children) {
                onMenuItemClose(li);
            }
        }
        
        return this.each(function() {
        	
        	// disabled accidental drag selecting on the menu
        	$(this).bind("mousedown", function(event){
        		$("body").trigger("mousedown");
        		return false;
        	});
        	
            var ul = $(this).children("ul:first");
        
            // add style classes
            $(this).addClass("ui-corner-all outline ui-menu-bar ui-widget ui-widget-content");
            ul.addClass("ui-menu-nav ui-helper-reset ui-helper-clearfix ui-widget-header ui-corner-top");
            ul.children("li").addClass("ui-state-default ui-corner-all");
            ul.find("ul").each(function(){                
                $(this).children("li:first").addClass("ui-corner-top").addClass("ui-menu-item-first");
                $(this).children("li:last").addClass("ui-corner-bottom").addClass("ui-menu-item-last");
                
                $(this).children("li").each(function(){
                    if( $(this).children("ul").length > 0 ) {
                        $(this).addClass("ui-menu-item-parent");
                        $(this).prepend('<div style="position: absolute" class="ui-menu-parent-icon ui-icon ui-icon-triangle-1-e"></div>');
                    }
                    
                    if( $(this).hasClass("ui-menu-checkable") ) {
                        $(this).prepend('<div style="position: absolute" class="ui-menu-check-icon ui-icon ui-icon-check"></div>');
                        
                        if( $(this).data("item").checked ){
                        	$(this).children(".ui-menu-check-icon").addClass("ui-menu-checked");
                        }
                        
                        $(this).click(function(){
                        	if( !disabled( $(this) ) ){
                        	
	                            var check = $(this).children(".ui-menu-check-icon");
	                            
	                            check.toggleClass("ui-menu-checked");
	                            
	                            if( check.hasClass("ui-menu-checked") ) {
	                                onMenuItemCheck( $(this) );
	                            } else {
	                                onMenuItemUncheck( $(this) );
	                            }
                        	}
                        });
                    }
                });
            });
            
            // only top level are menu items
            ul.find("li").addClass("ui-menu-item");
            ul.children("li").removeClass("ui-menu-item").addClass("ui-menu-title");
            ul.children("li").each(function(){
                if( $(this).children("ul").length > 0 ) {
                    $(this).find(".ui-menu-label:first").append(options.titleArrowText);
                } else if( !$(this).hasClass("ui-menu-clickable") ) {
                	// automatically make togglable
                    $(this).addClass("ui-menu-togglable");
                }
            });
            
            // differentiate top level and sub menus
            ul.find("ul").each(function(){
                if( $(this).parent().hasClass("ui-menu-title") ) {
                    $(this).addClass("ui-top-menu");
                } else {
                    $(this).addClass("ui-sub-menu");
                }
            });
            
            // remove corner from top level menus
            ul.find(".ui-top-menu").children(".ui-menu-item-first");
            
            // set position and index
            ul.find("ul").css("position", "absolute").css("z-index", 999).hide();

            ul.children("li").not(".ui-menu-title.ui-menu-clickable").not(".ui-menu-title.ui-menu-checkable").toggle(function(){
            	if( !disabled($(this)) ){
            		openMenu( $(this) );
            	}
            }, function(){
            	if( !disabled($(this)) ){
            		closeMenu( $(this) );
            	}
            });
            
            ul.children("li.ui-menu-title.ui-menu-checkable").each(function(){
            	if( $(this).data("item").checked ){
            		$(this).addClass("ui-state-active");
            	}
            }).click(function(){
            	if( !disabled( $(this) ) && $(this).hasClass("ui-state-active") ){
            		closeMenu( $(this) );
            	} else if( !disabled( $(this) ) ) {
            		openMenu( $(this) );
            	}
            });
            
            ul.children("li.ui-menu-title.ui-menu-clickable").mousedown(function(){
            	if( !disabled( $(this) ) ){
            		$(this).addClass("ui-state-active");
            	}
            }).mouseup(function(){
            	if( !disabled( $(this) ) ){
	            	$(this).removeClass("ui-state-active");
	            	onMenuItemClick( $(this) );
	            	onMenuItemOn( $(this) );
            	}
            }).bind("mouseout", function(){
            	if( !disabled( $(this) ) ){
            		$(this).removeClass("ui-state-active");
            	}
            });
            
            ul.find(".ui-menu-item").mouseenter(function(){
            	if( !disabled( $(this) ) ){
	            	onMenuItemSelect( $(this) );
	                openMenu( $(this) );
            	}
            }).mouseleave(function(){
            	if( !disabled( $(this) ) ){
	            	onMenuItemDeselect( $(this) );
	            	closeMenu( $(this) );
            	}
            });
            
            ul.find("li").click(function(){
                // don't send parent clicks
                if( $(this).find(".ui-menu-item.ui-state-active").length > 0 || disabled($(this)) ) {
                    return;
                }
            
                // if it's not selected, we've clicked it, not the user
                // BUT always send toggles
                if( $(this).hasClass("ui-state-active") || $(this).hasClass("ui-menu-togglable") ) {
                    onMenuItemClick( $(this) );
                    
                    if( $(this).is(".ui-menu-togglable.ui-menu-title") ){
                    	if( $(this).hasClass("ui-state-active") ){
                    		onMenuItemOn( $(this) );
                    	} else {
                    		onMenuItemOff( $(this) );
                    	}
                    } else if ( !$(this).is(".ui-menu-checkable") && !$(this).is(".ui-menu-title") ){
                    	onMenuItemOn( $(this) );
                    }
                }
            });
            
            function closeAll() {
                ul.find(".ui-state-active").reverse().each(function(){
                    if( ! $(this).hasClass("ui-menu-togglable") ) {
                        $(this).click();
                    }
                });
            }
            
            $("html").bind("click", function(){
                closeAll();
            });
            
            if( options.closeOnEsc ){
	            $("body").bind("keydown", function(e){
	            	if( e.which == 27 ){
	            		closeAll();
	            	}	
	            });
            }
        });  
    };  
})(jQuery);  