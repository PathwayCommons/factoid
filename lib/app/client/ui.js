// useful, reusable ui components

var isTouch = ('ontouchstart' in window);

window.ui = {

  focusWhenVisible: function( id, timeLimit ){ 
    var $ele = $( document.getElementById(id) );

    setTimeout(function(){ // because inside a handler won't always work
      //$ele.focus();
      $ele[0].select();
    }, 10);
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