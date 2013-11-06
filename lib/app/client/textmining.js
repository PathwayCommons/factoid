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
    ;
    
    $button.attr('disabled', 'true');
    $textarea.attr('disabled', 'true');
    $outputInfo.attr('disabled', 'true');

    $overlay.removeClass('hidden').addClass('shown');
    doc.addEntitiesFromText( text, cyutil.getNewEntityPosition, function( numEnts ){

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

      next && next( numEnts );
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

  // grab abstract from hash url
  var hash = location.hash;
  var isDemo = location.hash.length >= 5 && location.hash.substring(0, 5) === '#demo';
  var abstract;

  if( isDemo ){
    abstract = location.hash.substring(6); // e.g. #demo/some abtrsact text
  } else {
    abstract = location.hash.substring(1); // e.g. #some abstract text
  }

  if( abstract !== '' ){
    $('#textmining-text').val( abstract );
    
    $('.help-ball[data-stage="textmining"]').qtip('hide');

    submitTextmining( abstract, function(numEnts){
      // if( numEnts !== 0 ){
      //   doc.hideTextmining();
      // }
    } );
  }

});