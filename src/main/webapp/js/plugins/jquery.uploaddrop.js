;(function($){
	
	// makes an element upload a file on click
	$.fn.uploaddrop = function(opts){
		
		if( opts == "cancel" ){
			return $(this).each(function(){
				var jqXHR = $.data(this, "jqXHR");
				jqXHR.abort();
			});
			
			return;
		} else if( opts == "disable" ){
			$(this).addClass("ui-state-disabled");
			$(this).find(".ui-upload-input").fileupload("disable");
			return;
			
		} else if( opts == "enable" ){
			$(this).removeClass("ui-state-disabled");
			$(this).find(".ui-upload-input").fileupload("enable");
			return;
		}
		
		var defaults = {
			url: "",
			paramName: "file",
			enctype: "multipart/form-data",
			success: function(metadata, file){},
			error: function(error, metadata){},
			start: function(metadata){},
			complete: function(metadata, file){}
		};
		
		var options = $.extend({}, defaults, opts);
		
		return $(this).each(function(){
			var target = this;
			
			var form = $('<form method="post" enctype="' + options.enctype + '"></form>');
			form.attr("action", options.url);
			$(this).append(form);
			
			var input = $('<input type="file"></input>');
			input.attr("name", options.paramName);
			input.css({
				"opacity": 0
			});
			input.addClass("ui-upload-input");
			form.append(input);
			
			if( $(target).css("position") == "static" ){
				$(target).css("position", "relative");
			}
			$(target).css({
				"overflow": "hidden"
			});
			
			$(target).addClass("ui-upload ui-state-default ui-upload-drag-and-drop");
					
			$(target).bind("mouseover", function(){
				$(target).addClass("ui-state-hover");
			}).bind("mouseout", function(){
				$(target).removeClass("ui-state-hover");
			});
			
			function isFunction(fn){
				return fn != null && typeof fn == typeof function(){};
			}
			
			function fire(listener, param1, param2, param3, param4){
				var fn = options[listener];
				if( isFunction(fn) ){
					fn(param1, param2, param3, param4);
				}

				$(target).trigger("upload" + listener, [ param1, param2, param3, param4 ]);
			}
			
			var jqXHR;
			
			input.fileupload({
				done: function(e, data){
					fire("success", data.files[0], data.result);	
				},
				send: function(e, data){
					$(target).addClass("ui-state-uploading");
					fire("start", data.files[0]);
				},
				fail: function(e, data){
					fire("error", data.errorThrown, data.files[0]);
				},
				always: function(e, data){
					$(target).removeClass("ui-state-uploading");
					fire("complete", data.files[0], data.result);
				},
				add: function(e, data){
					jqXHR = data.submit();
					$.data(target, "jqXHR", jqXHR);
				},
				progress: function(e, data){
					fire("progress", data.files[0], data.loaded, data.total);
				},
				dropZone: $(target)
			});
			
			
		});
		
	}
	
})(jQuery); 