
// need to set this or jquery adds "[]" to array variables in posts
// bad for networks -- spring can pick up "networks" not "networks[]"
jQuery.ajaxSettings.traditional = true;

ui = {};

$(function(){
	if( $("html").attr("version").search("antdebug") >= 0 ){
		$.console.enable();
	} else {
		$.console.disable();
	}
	
	$.console.hook("ui");
	$.console.hook("UiState.enter");
	$.console.hook("UiState.leave");

	 // load i18n files before showing any UI that
	 // may depend on having the strings
	 $.i18n({
		 url: util.absolute_url("json/i18n")
	 });
});

