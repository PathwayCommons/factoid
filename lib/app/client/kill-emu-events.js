$(function(){
  var isTouch = ('ontouchstart' in window);

  function kill(type){
    $('body')[0].addEventListener(type, function(e){
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
  }
});