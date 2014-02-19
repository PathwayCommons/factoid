$(function(){
  $(document).on('tap', '.overlay .close', function(){
    var $this = $(this);
    var $overlay = $(this).closest('.overlay');

    $overlay.removeClass('shown overlay-shown-true').trigger('close');
  });

  $(document).on('tap', '.overlay', function(e){
    var $target = $(e.target);
    var $overlay = $(this);
    var outsideTap = $target.parents().add( $target ).filter('.overlay-popup').size() === 0;

    if( outsideTap ){
      $overlay.removeClass('shown overlay-shown-true').trigger('close');
    }
  });

  $('.help-ball[data-stage="textmining"]').trigger('lockqtip');

  $(document).on('close', '#info-overlay', function(){
    setTimeout(function(){
      $('.help-ball[data-stage="textmining"]').trigger('unlockqtip');
    }, 150);
  });

  $(document).on('tap', '#about-bar .show-more', function(){
    doc.hideAboutBar();
  });

  // workaround to accommodate the description embedded in the app
  // $(document).on('tap click', '#info-overlay', function(){
  //   console.log('OVERLAY')

  //   if( doc.getStage() === 'textmining' ){
  //     $('.help-ball[data-stage="textmining"]').trigger('showqtip');
  //   }
  // });

  var opt1 = location.hash === '#option1';
  var opt2 = location.hash === '#option2';
  var opt3 = location.hash === '#option3';

  if( opt1 ){
    $('body').addClass('option-1');
  } else if( opt2 ){
    $('body').addClass('option-2');
    doc.showAbout();
  } else if( opt3 ){
    $('body').addClass('option-3');
  }

});