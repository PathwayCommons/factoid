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


    $ball.qtip({
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

  $(document).on('tap', '.help-content[data-for-stage="organisms"] .skip-button', function(){
    var $this = $(this);

    doc.goToStage('entities');
    $this.parents('.qtip:first').qtip('hide');

  });

  $(document).on('tap', '.help-content .send', function(){
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

});