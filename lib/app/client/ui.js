// useful, reusable ui components

var isTouch = ('ontouchstart' in window);

window.ui = {

  focusWhenVisible: function( id, timeLimit ){ 
    var $ele = $( document.getElementById(id) );
    $ele.focus();
  },

  maintainScrollTop: function( id, $container, fn ){
    var $ele = function(){
      return $( document.getElementById(id) );
    };  

    var distFromTop = $ele().position().top;

    fn();

    var top = $container.scrollTop();
    var newDistFromTop = $ele().position().top;
    var delta = newDistFromTop - distFromTop;

    $container.scrollTop( top + delta );
  }

};