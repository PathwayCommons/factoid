// useful, reusable ui components

window.ui = {

  focusWhenVisible: function( id, timeLimit ){
    if( timeLimit === undefined ){
      timeLimit = 500;
    }

    var actionOccurred = false;
    $('body').one('click mousedown mouseup touchstart touchend keydown keyup paste', function(e){
      if( e.target.id !== id ){
        actionOccurred = true;
      }
    });

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
    }, 8);
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