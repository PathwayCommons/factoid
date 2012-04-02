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

;(function($){
	
	$.fn.dialogpaper = function(opts){
		var defaults = {
			resizable: false
	    };
		options = $.extend(defaults, opts);
		
		$(this).html( '<div class="scrollbarpaper-wrapper">' + $(this).html() + '</div>' );
		$(this).dialog(options);
		//$(this).scrollbarPaper();
		
		// press last button on enter---not the first one
		if( options.modal ){
			var last_button = $(this).parents(".ui-dialog").find(".ui-dialog-buttonset").find("button:last");
			var enter_listener = function(evt){
				if( evt.which == 13 ){
					last_button.click();
				}
			}
			$("body").bind("keydown", enter_listener);	
		}
		
		$(this).bind("dialogclose", function(){
			$(this).dialog("destroy");
		});
		
	};
	
})(jQuery); 