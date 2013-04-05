$(function(){
  var isTouch = ('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch; // taken from modernizr 

  function kill(type){
    window.document.body.addEventListener(type, function(e){
      e.preventDefault();
      e.stopPropagation();
      return false;
    }, true);
  }

  if( isTouch ){
    kill('mousedown');
    kill('mouseup');
    kill('click');
    kill('mousemove');
    kill('mouseover');
    kill('mouseout');
  }
});