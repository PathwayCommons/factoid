$(function(){
  
  $('.help-ball').each(function(){
    var $ball = $(this);
    var stage = $ball.attr('data-stage');
    var $content = $('.help-content[data-for-stage="' + stage + '"]');

    $ball.qtip({
      position: {
        my: 'right top',
        at: 'center left'
      },
      style: { classes: 'help-ball-qtip' },
      content: $content,

      events: {
        show: function(){
          var $qtip = $(this);
        }
      }
    });
  });

});