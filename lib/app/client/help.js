$(function(){

  var onShow = {
    textmining: function(){
      doc.showTextmining();
      ui.focusWhenVisible('textmining-text');
    },

    organisms: function(){
      ui.focusWhenVisible( $('#tools-organisms button')[0] );
    }
  };

  var highlightTargets = {
    textmining: 'textmining-input',
    organisms: 'tools-organisms',
    entities: 'entities-list'
  };

  $('.help-ball').each(function(){
    var $ball = $(this);
    var stage = $ball.attr('data-stage');
    var $content = $('.help-content[data-for-stage="' + stage + '"]');

    $.helperQtip({
      events: 'tap',
      selector: '.help-ball[data-stage="' + stage + '"]'
    }, {
      position: {
        my: 'top right',
        at: 'bottom center'
      },
      style: { classes: 'help-ball-qtip' },
      content: $content,

      events: {
        show: function(){
          var $qtip = $(this);
          var onShowFn = onShow[ stage ];
          var highlight = $( '#' + highlightTargets[ stage ] );

          if( onShowFn ){ onShowFn(); }

          if( highlight.length > 0 ){
            highlight.addClass('highlight');
          }
        },

        hide: function(){
          var highlight = $( '#' + highlightTargets[ stage ] );

          doc.completeStage( stage );

          if( highlight.length > 0 ){
            highlight.removeClass('highlight');
          }
        }
      }
    });
  });

  if( doc.getStage() === 'textmining' ){
    $('.help-ball[data-stage="textmining"]').trigger('showqtip');
  }

  doc.goToStage(function( stage ){
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
    doc.showOverlay('contact');
  }

  function hideContact(){
    doc.hideOverlay('contact');
  }

  $(document).on('tap', '.contact-open-button', function(){
    var $this = $(this);

    showContact();
    $this.parents('.qtip:first').qtip('hide');
  });

});