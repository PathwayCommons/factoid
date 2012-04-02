;(function($){
	$.fn.uploadbutton = function(opts){
		
		if( typeof opts == typeof "" ){
			$(this).upload(opts);
			return;
		}
		
		var defaults = {
			icons: {
				primary: "ui-icon-circle-arrow-n",
				start: "ui-icon-loading",
				cancel: "ui-icon-circle-close",
				success: "ui-icon-circle-check",
				error: "ui-icon-alert",
				progressed: "ui-icon-loading",
				cancelButton: "ui-icon-closethick"
			},
			startText: null,
			cancelText: null,
			successText: null,
			errorText: null,
			progressedText: null,
			resetDelay: 2000,
			resetAnimationSpeed: 250
		};
			
		var options = $.extend({}, defaults, opts);
		var target = this;
		
		$(target).button(options);
		$(target).upload(options);
		
		var resetTimeout;

		function clearTimeouts(){
			clearTimeout(resetTimeout);
		}
		
		function reset(){
			clearTimeout(resetTimeout);
			resetTimeout = setTimeout(function(){
				
				fadeOut(function(){
					setLabel( origLabel );
					setIcon( options.icons.primary );
					fadeIn();
					$(target).removeClass("ui-state-upload-complete");
					$(target).removeClass("ui-state-upload-progressed");
				});
				
			}, options.resetDelay);
		}
		
		$(target).find(".ui-icon").addClass("ui-upload-status-icon");
		
		$(target).addClass("ui-upload-button");
		
		var origLabel = $(this).button("option", "label");
		var cachedMetadata;
		
		function fadeOut(callback){
			var label = $(target).find(".ui-button-text");
			var button = $(target).find(".ui-upload-status-icon");
			
			$(label).add(button).fadeTo(options.resetAnimationSpeed, 0.01, callback);
		}
		
		function fadeIn(callback){
			var label = $(target).find(".ui-button-text");
			var button = $(target).find(".ui-icon");
			
			$(label).add(button).fadeTo(options.resetAnimationSpeed, 1, callback);
		}
		
		function setLabel(text){
			$(target).find(".ui-button-text").html( text );
		}
		
		function setLabelByFn(fn, metadata, msg){
			if( isLabelFunction(fn, metadata, msg) ){
				setLabel( fn(metadata, msg) );
			}
		}
		
		function currentlyUploading(){
			return $(target).hasClass("ui-state-uploading");
		}
		
		function isFunction(fn){
			return typeof fn == typeof function(){};
		}
		
		function isLabelFunction(fn, metadata, msg){
			return isFunction(fn);
		}
		
		function setIcon(type){
			$(target).find(".ui-upload-status-icon").attr("class", "ui-button-icon-primary ui-icon ui-upload-status-icon " + type);
		}
		
		$(target).bind("uploadstart", function(e, metadata){
			clearTimeouts();
			$(target).removeClass("ui-state-upload-progressed");
			setLabelByFn( options.startText, metadata );
			setIcon(options.icons.start);
			cachedMetadata = metadata;
		
		}).bind("uploadsuccess", function(e, metadata){
			clearTimeouts();
			$(target).addClass("ui-state-upload-complete");
			setLabelByFn( options.successText, metadata );
			setIcon(options.icons.success);
			
			reset();
		}).bind("uploaderror", function(e, error, metadata){
			clearTimeouts();
			
			if( isLabelFunction( options.errorText ) ){
				$(target).addClass("ui-state-upload-error");
				setLabelByFn( options.errorText, metadata, error );
				setIcon(options.icons.error);
			}
			
			reset();
		}).bind("uploadprogress", function(e, metadata, loadedBytes, totalBytes){
			
			if( totalBytes == null ){
				progressBar.hide();
				return;
			}
			
			var percentComplete = (loadedBytes/totalBytes * 100);
			progressBar.css("width", percentComplete + "%");
			
			if( loadedBytes == totalBytes 
					|| ($.browser.mozilla && percentComplete >= 95) ){ // TODO remove mozilla fix (never gets to 100%)
				clearTimeouts();
				resetTimeout = setTimeout(function(){
					$(target).addClass("ui-state-upload-progressed");
					
					if( isLabelFunction( options.progressedText ) ){
						setLabelByFn( options.progressedText, metadata );
						setIcon( options.icons.progressed );
					}
				}, options.resetAnimationSpeed)
			}
		});
		
		var progress = $('<div class="ui-upload-progress"></div>');
		var progressBar = $('<div class="ui-upload-progress-bar"></div>');
		progress.append(progressBar);
		$(target).append(progress);
		
		$(target).children().mousedown(function(e){
			if( $(target).hasClass("ui-state-disabled") || $(target).hasClass("ui-state-uploading") ){
				$(target).parent().trigger(e);
				return false;
			}
		});
		
		var cancel = $('<div class="ui-upload-cancel"> <div class="ui-icon ' + options.icons.cancelButton + '"></div> </div>');
		$(target).append(cancel);
		
		cancel.bind("mousedown", function(e){
			cancel.addClass("ui-state-active");
			$(target).parent().trigger(e);
			return false;
		}).bind("mouseup mouseout", function(e){
			cancel.removeClass("ui-state-active");
			$(target).parent().trigger(e);
			return false;
		}).bind("click", function(){
			clearTimeouts();
			$(target).upload("cancel");
			$(target).removeClass("ui-state-uploading");
			
			if( isLabelFunction( options.cancelText ) ){
				setLabelByFn( options.cancelText, cachedMetadata );
				setIcon( options.icons.cancel );
			}
			
			reset();
		});

	};
})(jQuery); 