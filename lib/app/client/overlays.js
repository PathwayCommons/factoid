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

  $(document).on('tap', '#about-bar .show-more', function(){
    doc.hideAboutBar();
  });

  var opt1 = location.hash === '#option1';
  var opt2 = location.hash === '#option2';
  var opt3 = location.hash === '#option3';

  if( opt1 ){
    $('body').addClass('option-1');
  } else if( opt2 ){
    $('body').addClass('option-2');
    doc.showOverlay('about');
  } else if( opt3 ){
    $('body').addClass('option-3');
  }

});