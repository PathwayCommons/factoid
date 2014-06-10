// useful, reusable ui components

var isTouch = ('ontouchstart' in window);

window.ui = {

  focusWhenVisible: function( id, timeLimit ){ 
    var $ele = $( id instanceof HTMLElement ? id : document.getElementById(id) );

    $ele[0].focus();
    return;

    setTimeout(function(){ // because inside a handler won't always work
      //$ele.focus();
      if( $ele && $ele[0] ){ 
        $ele[0].select();
      }
    }, 50);
  },

  maintainScrollTop: function( id, $container, fn ){
    var $ele = function(){
      return $( id instanceof HTMLElement ? id : document.getElementById(id) );
    };  

    var distFromTop = $ele().position().top;

    fn();

    var top = $container.scrollTop();
    var newDistFromTop = $ele().position().top;
    var delta = newDistFromTop - distFromTop;

    $container.scrollTop( top + delta );
  }

};