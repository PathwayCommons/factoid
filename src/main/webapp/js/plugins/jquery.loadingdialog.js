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
	
	$.loadingdialog = function(opts){
		var defaults = {
			resizable: false,
			draggable: false,
			closeOnEscape: false,
			modal: true,
			title: 'Loading',
			content: '',
			hideSpeed: 120
	    };
		options = $.extend(defaults, opts);
		
		if( options.destroy || opts == "destroy" ){
			$(".ui-loading-dialog").fadeOut(options.hideSpeed, function(){
				$(".ui-loading-dialog").remove();
				$(".ui-loading-dialog-content").parent().remove();
			});
		} else {
			var div = $('<div> <h2>' + options.title + '</h2>  <div class="ui-loading-dialog-content">' + options.content + '</div> <div class="ui-loading-dialog-loading-icon"></div></div>').dialog(options);
			div.parents(".ui-dialog").addClass("ui-loading-dialog");
		}
	};
	
})(jQuery); 