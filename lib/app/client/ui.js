// useful, reusable ui components

var isTouch = ('ontouchstart' in window);

window.ui = {

  focusWhenVisible: function( id, timeLimit ){ 
    var $ele = $( document.getElementById(id) );
    $ele.focus();

    return;
    if( timeLimit === undefined ){
      timeLimit = 500;
    }

    var unfocusInterval;
    function startUnfocusInterval(){
      unfocusInterval = setInterval(function(){
        var $ele = $( document.getElementById(id) );

        if( !$ele.is(':focus') ){
          clearInterval( visibleInterval );
          $ele.focus();
        }
      }, 8);

      setTimeout(function(){
        clearInterval( unfocusInterval );
      }, timeLimit);
    }

    var visibleInterval = setInterval(function(){
      var $ele = $( document.getElementById(id) );

      if( $ele.is(':focus') ){
        clearInterval( visibleInterval );
        return;

      } else if( $ele.is(':visible') ){
        clearInterval( visibleInterval );
        $ele.focus();

        //startUnfocusInterval();
      }
    }, isTouch ? 500 : 8);
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