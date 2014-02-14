$(function(){
  $(document).on('tap', '.overlay .close', function(){
    var $this = $(this);
    var $overlay = $(this).closest('.overlay');

    $overlay.removeClass('shown').trigger('close');
  });

  $(document).on('tap', '.overlay', function(e){
    var $target = $(e.target);
    var $overlay = $(this);
    var outsideTap = $target.parents().add( $target ).filter('.overlay-popup').size() === 0;

    if( outsideTap ){
      $overlay.removeClass('shown').trigger('close');
    }
  });

  $('.help-ball[data-stage="textmining"]').trigger('lockqtip');

  $(document).on('close', '#info-overlay', function(){
    setTimeout(function(){
      $('.help-ball[data-stage="textmining"]').trigger('unlockqtip');
    }, 100);
  });

  // workaround to accommodate the description embedded in the app
  // $(document).on('tap click', '#info-overlay', function(){
  //   console.log('OVERLAY')

  //   if( doc.getStage() === 'textmining' ){
  //     $('.help-ball[data-stage="textmining"]').trigger('showqtip');
  //   }
  // });

});