$(function(){
  var isTouch = ('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch; // taken from modernizr 

  function kill(type){
    window.addEventListener(type, function(e){
      var tag = e.target.tagName.toLowerCase();
      if( tag === 'input' || tag === 'textarea' ){
        return;
      }

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