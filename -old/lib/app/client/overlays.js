$(function(){
  $(document).on('tap', '.overlay .close', function(){
    var $this = $(this);
    var $overlay = $(this).closest('.overlay');
    var id = $overlay.attr('data-overlay-id');

    doc.hideOverlay(id);
  });

  $(document).on('tap', '.overlay', function(e){
    var $target = $(e.target);
    var $overlay = $(this);
    var outsideTap = $target.parents().add( $target ).filter('.overlay-popup').size() === 0;
    var closeable = $overlay.attr('data-overlay-closeable') !== undefined;
    var id = $overlay.attr('data-overlay-id');

    if( outsideTap && closeable ){
      doc.hideOverlay(id);
    }
  });

  $(document).on('tap click', '.overlay.splash', function(e){
    var $overlay = $(this);
    var id = $overlay.attr('data-overlay-id');
    var closeable = $overlay.attr('data-overlay-closeable') !== undefined;
    
    if( closeable ){
      doc.hideOverlay(id);
    }

    e.stopPropagation();
  });

  // show about splash overlay on load
  doc.showOverlay('about');

});