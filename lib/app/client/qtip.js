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

$.fn.showqtip = function( options ){
  options = $.extend(true, {
    show: {
      event: 'showqtip' // a cheap trick so we show the qtip right away (qtip doesn't have that option)
    }
  }, options);

  return $(this).qtip( options ).trigger( 'showqtip' ); // init & show right away
};