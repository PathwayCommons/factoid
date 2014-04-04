$(function(){

  function submitTextmining(text, next){
    var $button = $('#textmining-input .add');
    var $textarea = $('#textmining-text');
    var $container = $('#textmining-input');
    var $overlay = $('#textmining-overlay');
    var $outputInfo = $('#textmining-input .output-info');

    $container
      .addClass('loading')
      .removeClass('no-results')
      .removeClass('has-error')
    ;
    
    $button.attr('disabled', 'true');
    $textarea.attr('disabled', 'true');
    $outputInfo.attr('disabled', 'true');

    $overlay.removeClass('hidden').addClass('shown');
    doc.addEntitiesFromText( text, cyutil.getNewEntityPosition, function( err, numEnts ){

      if( err ){
        $container.addClass('has-error');
        next && next(err);
        return;
      }

      if( numEnts > 0 ){
        cyutil.relayout();
      } else {
        $container.addClass('no-results');
      }

      $overlay.removeClass('shown').addClass('hidden');
      $container.removeClass('loading');
      $button.removeAttr('disabled');
      $textarea.removeAttr('disabled');
      $outputInfo.removeAttr('disabled', 'true');

      next && next( err, numEnts );
    } );
  }

  $('html').on('tap enterkey', '#textmining-input .add, #textmining-input .output-info', function(){
    var $textarea = $('#textmining-text');
    var $button = $(this);
    var text = $textarea.val();

    submitTextmining(text);
  });

  $('html').on('tap enterkey', '#textmining-examples .example', function(){
    var $ex = $(this);
    var text = $ex.attr('data-text');

    $('#textmining-text').val( text );
  });  

});