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
    event: 'unfocus',
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

$.fn.showqtip = function( options ){
  options = $.extend(true, {
    show: {
      event: 'showqtip'
    }
  }, options);

  return $(this).qtip( options ).trigger( 'showqtip' );
};