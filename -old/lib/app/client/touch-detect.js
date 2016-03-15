$(function(){
	var isTouch = ('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch; // taken from modernizr 

	if( isTouch ){
		$('html').addClass('touch')
	}
});