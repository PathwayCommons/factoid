// set good defauls for qtips so we don't repeat ourselves over and over
$.fn.qtip.defaults = $.extend(true, {}, $.fn.qtip.defaults, {
  position: {
    my: 'top center',
    at: 'bottom center',
    effect: false,
    viewport: true,
    adjust: {
      method: 'flipinvert'
    }
  },

  show: {
    event: 'click',
    delay: 0,
    solo: true,
    effect: false
  },

  hide: {
    event: 'unfocus hideqtip',
    delay: 0,
    fixed: true,
    leave: false,
    effect: false
  },

  style: {
    tip: {
      height: 10,
      width: 20
    }
  }
});

// creates a dom clone of part of a derby html template
// perfect for use in qtips (since it updates only when visible & in the dom)
// NB: this means that the content passed to qtip must be in a function, else rerendering on show does nothing
// NB: a derby clone must come from an element with an id specified
$.fn.derbyClone = function( intervalDuration ){
  intervalDuration = intervalDuration === undefined ? 100 : intervalDuration;

  function makeClone( $ele ){
    var $clone =  $ele.clone(false);

    $clone
      .find('*').andSelf()
        .removeAttr('id') // remove ids so we don't cause id collisions
    ;

    return $clone;
  }

  var domEle = this;
  var $domEle = $(domEle);
  var $initDomEle = $domEle;

  var $clone = makeClone( $domEle );
  var id = $domEle.attr('id'); // id to watch for
  var initHtml = $domEle.html();

  var interval = setInterval(function(){
    var $cloneParents = $clone.parents();
    var cloneInDom = $cloneParents.filter('body').length !== 0;
    if( !cloneInDom ){ // then we don't have to update the clone anymore
      clearInterval( interval );
      return;
    }

    var cloneIsVisible = cloneInDom && $clone.is(':visible');
    if( !cloneIsVisible ){ // then just don't update for now
      var cloneInQtip = $cloneParents.filter('.qtip').length !== 0;

      if( cloneInQtip ){ // then we don't need to update the clone anymore, since the qtip will be rerendered on show
        clearInterval( interval );
      }

      return; 
    }

    var $nowDomEle = $( document.getElementById(id) ); // since it could be replaced by derby
    var domEleChanged = $nowDomEle[0] !== $initDomEle[0];
    var updateRequired = domEleChanged;

    if( !updateRequired ){ // don't check html right off the bat b/c it's prob a much more expensive check
      var html = $nowDomEle.html();
      var htmlDiff = html !== initHtml;
      updateRequired = htmlDiff;
    }

    if( updateRequired ){ // then make a new clone
      var $newClone = makeClone( $nowDomEle );
      $clone.after( $newClone );
      $clone.remove();

      // since we'll do more comparisons later
      initHtml = $nowDomEle.html(); 
      $initDomEle = $nowDomEle;
      $clone = $newClone;
    }
  }, intervalDuration);

  return $clone;
};

// forces qtip to be rerendered on show
$(function(){
  $('body').on('tooltipshow', '.qtip', function(){
    $(this).qtip('render'); // force rendering to ensure content is up-to-date
  });
});

$.fn.showqtip = function( options ){
  options = $.extend(true, {
    show: {
      event: 'showqtip' // a cheap trick so we show the qtip right away (qtip doesn't have that option)
    }
  }, options);

  return $(this).qtip( options ).trigger( 'showqtip' ); // init & show right away
};