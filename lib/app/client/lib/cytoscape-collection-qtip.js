(function( $ ){
  // allow qtips to be called on nodes
  cytoscape('collection', 'qtip', function( options ){
    var ele = this[0];
    var $container = $( ele.cy().container() );
    if( !ele.isNode() ){ return this; } // then no qtip for you (also chain)

    var $div = $('<div></div>');
    $('body').append( $div );

    var event = ( options && options.show ? options.show.event : undefined ) || $.fn.qtip.defaults.show.event;
    ele.on(event, function(){
      // update the div position based on the node position
      var p = ele.renderedPosition();
      var w = ele.renderedWidth();
      var h = ele.renderedHeight();

      var left = p.x + $container.offset().left - w/2;
      var top = p.y + $container.offset().top - h/2;

      $div.css({
        position: 'absolute',
        left: left,
        top: top,
        width: w,
        height: h,
        zIndex: -1 // position so it can never be seen
      });

      // and trigger the event so the tooltip is shown
      $div.trigger(event);
    });

    // actually put the qtip on the div
    $div.qtip( options );
  });
})( jQuery );

