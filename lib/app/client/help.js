$(function(){

  $('.help-ball').each(function(){
    var $ball = $(this);
    var stage = $ball.attr('data-stage');
    var $content = $('.help-content[data-for-stage="' + stage + '"]');
    var positionFor = {
      textmining: {
        my: 'right top',
        at: 'center left'
      },

      organisms: {
        my: 'right center',
        at: 'left center'
      },

      entities: {
        my: 'right center',
        at: 'left center'
      }
    };

    $.helperQtip({
      events: 'tap',
      selector: '.help-ball[data-stage="' + stage + '"]'
    }, {
      position: positionFor[ stage ],
      style: { classes: 'help-ball-qtip' },
      content: $content,

      events: {
        show: function(){
          var $qtip = $(this);

          if( stage === 'textmining' ){
            doc.showTextmining();
            $('#textmining-text').focus();
          }
        }
      }
    });
  });

  if( doc.getStage() === 'textmining' ){
    $('.help-ball[data-stage="textmining"]').trigger('showqtip');
  }

  doc.goToStage(function( stage ){
    console.log(stage)
    setTimeout(function(){
      $('.help-ball[data-stage="'+ stage +'"]').trigger('showqtip');
    }, 10);
    
  });

  $(document).on('tap', '.help-content[data-for-stage="organisms"] .skip-button', function(){
    var $this = $(this);

    doc.goToStage('entities');
    //$this.parents('.qtip:first').qtip('hide');

  });

  $(document).on('tap', '.contact .send', function(){
    var $send = $(this);
    var $contact = $send.parents('.contact:first');
    var $text = $contact.find('.message');
    var $from = $contact.find('.from');
    var $all = $send.add( $from ).add( $text );

    var text = $text.val();
    var from = $from.val();

    $all.attr('disabled', 'disabled');
    $contact.addClass('sending').removeClass('sent');

    services.userFeedback( from, text, function(){
      $all.removeAttr('disabled');
      $contact.removeClass('sending').addClass('sent');
    } );    
  });

  function showContact(){
    $('#contact-overlay').removeClass('hidden').addClass('shown');
  }

  function hideContact(){
    $('#contact-overlay').removeClass('shown').addClass('hidden');
  }

  $(document).on('tap', '.contact-open-button', function(){
    var $this = $(this);

    showContact();
    $this.parents('.qtip:first').qtip('hide');
  });

  $(document).on('tap', '.contact .close', function(){
    var $this = $(this);

    hideContact();
  });

  $(document).on('tap', '#contact-overlay', function(e){
    var $target = $(e.target);
    var outsideTap = $target.parents().add( $target ).filter('.overlay-popup').size() === 0;

    if( outsideTap ){
      hideContact();
    }
  });

});