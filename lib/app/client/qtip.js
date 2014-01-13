return;

var isTouch = ('ontouchstart' in window);

// set good defauls for qtips so we don't repeat ourselves over and over
$.fn.qtip.defaults = $.extend(true, {}, $.fn.qtip.defaults, {
  content: {
    title: { button: true }
  },

  position: {
    my: 'top center',
    at: 'bottom center',
    effect: false,
    viewport: true,
    adjust: {
      method: 'shift flipinvert flip'
    }
  },

  show: {
    container: $('html'), // by default so we don't get them destroyed if the body gets replaced by derby's templating
    event: '',
    delay: 0,
    solo: true,
    effect: false
  },

  hide: {
    event: '',
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


$.helperQtip = function( options, qtipOptions ){
  var $helper = $('<div></div>');
  var id;

  function positionHelper( ele ){
    var $ele = $(ele);
    var offset = $ele.offset();

    $helper.css({
      'position': 'absolute',
      'left': offset.left,
      'top': offset.top,
      'width': $ele.outerWidth(),
      'height': $ele.outerHeight(),
      'z-index': -1
    });
  }

  var shown = false;

  // delegate bind so we bypass problems from derby replacing the document
  $(document).on( options.events, options.selector, function(e){ 
    if( !shown ){
      positionHelper( this );
      $helper.qtip('show');
      shown = true;
      // console.log('tap show')
    } else {
      $helper.qtip('hide');
      shown = false;
      // console.log('tap hide')
    }

  } );

  // for manual control
  $(document).on( 'showqtip', options.selector, function(e){ 
    positionHelper( this );
    $helper.qtip('show');
    shown = true;
    // console.log('force show')
  } );

  $(document).on( 'hideqtip', options.selector, function(e){ 
    $helper.qtip('hide');
    shown = false;
    // console.log('force hide')
  } );

  $(document).on( 'tap', function(e){ 
    var $tgt = $(e.target);
    var tgtInsideQtip = $tgt.parents().add( $tgt ).filter('#' + id).length > 0;
    var tgtIsActualTgt = $tgt.parents().add( $tgt ).filter( options.selector ).length > 0;

    if( !tgtInsideQtip && !tgtIsActualTgt ){
      shown = false;
      $helper.qtip('hide')
      // console.log('bg hide')

    }
  } );

  // assume the helper is never modified or removed by derby
  $('html').append( $helper );
  $helper.qtip( qtipOptions );

  id = 'qtip-' + $helper.qtip('api').id;
};


// creates a dom clone of part of a derby html template
// perfect for use in qtips (since it updates only when visible & in the dom)
// NB: this means that the content passed to qtip must be in a function, else rerendering on show does nothing
// NB: a derby clone must come from an element with an id specified
$.fn.derbyClone = function( intervalDuration, alwaysKeepChecking ){
  intervalDuration = intervalDuration === undefined || intervalDuration === 'default'
    ? 10 : intervalDuration;

    // console.log( arguments, this );

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

  if( intervalDuration !== false ){
    var interval = setInterval(function(){
      // console.log('interval');

      var $cloneParents = $clone.parents();
      var cloneInDom = $cloneParents.filter('body').length !== 0;
      if( !cloneInDom ){ // then we don't have to update the clone anymore
        // console.log('clone not in dom');
      
        !alwaysKeepChecking && clearInterval( interval );
        return;
      }

      var cloneIsVisible = cloneInDom && $clone.is(':visible');
      if( !cloneIsVisible ){ // then just don't update for now
        var $qtip = $cloneParents.filter('.qtip:first');
        var cloneInQtip = $qtip.length !== 0;

         // console.log('clone not vis');

        if( cloneInQtip ){ // then we don't need to update the clone anymore, since the qtip will be rerendered on show
          !alwaysKeepChecking && clearInterval( interval );
        }

        // console.log('not vis');

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
  }

  return $clone;
};

// forces qtip to be rerendered on show
$(function(){
  $('html').on('tooltipshow', '.qtip', function(){
    $(this).qtip('render'); // force rendering to ensure content is up-to-date
  });

  $('html').on('tap', '.close-qtip-button, .qtip-close', function(){
    $(this).parents('.qtip').qtip('hide');
  });
});


// plugin on top of qtips that shows help tooltips on mouseover
$.tooltip = function( options ){
  $('html').append('<div id="tooltip-help-target"></div>');

  function showTooltip( ele ){ // show tooltip on html dom ele
    var $ele = $(ele);
    var text = $ele.attr( options.attrs.content );
    var title = $ele.attr( options.attrs.title );
    var $helper = $('#tooltip-help-target');

    return $helper.qtip({
      content: {
        title: title,
        text: text
      },

      position: {
        target: $ele
      },

      show: {
        event: 'showhelpqtip',
        solo: false
      },

      hide: {
        event: 'mouseout click mousedown',
        target: $ele
      },

      style: { 
        classes: 'help-qtip',
        tip: {
          height: 8,
          width: 16
        }
      }
    }).trigger('showhelpqtip');
  }

  function positionHelper( ele ){
    var $ele = $(ele);
    var $helper = $('#tooltip-help-target');
    var offset = $ele.offset();

    $helper.css({
      'position': 'absolute',
      'left': offset.left,
      'top': offset.top,
      'width': $ele.outerWidth(),
      'height': $ele.outerHeight(),
      'z-index': -1
    });
  }

  function showAllTooltips(){ // show all tooltips and allow touching/clicking to focus them in case of overlap
    $('[' + options.attrs.content + ']:visible').each(function(){
      showTooltip( this );
    });
  }

  var optionsIsString = typeof options === typeof '';
  if( optionsIsString ){
    var command = options;

    switch( command ){
      case 'showall':
        showAllTooltips();
        break;

      default:
        break;
    }

    return this; // chaining
  }

  options = $.extend(true, {
    disable: function(){
      return false; // TODO return true if on touch device
    },
    activationEvents: 'mouseover', // space separated list of event names
    attrs: {
      content: 'data-tooltip',
      title: 'data-tooltip-title'
    }
  }, options);

  $('html').on('mouseover', '[' + options.attrs.content + ']', function(e){
    positionHelper( this );
    showTooltip( this );
  });

  return this; // chaining
};

$(function(){
  if( !isTouch ){
    //$.tooltip();
  }

  // remove titles (like on qtip on mouseover)
  // $('html').on('mouseover', '[title]', function(){
  //   $(this).removeAttr('title');
  // });
});
