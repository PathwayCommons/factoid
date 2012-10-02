// code for handling interactions with the info area (side bar)

$(function(){

  $('#add-entity-button').on('tap', function(){
    cyutil.addEntityInGoodPosition();
  });

  $('#add-interaction-button').on('tap', function(){
    cyutil.addInteractionInGoodPosition();
  });

  $('#textmining-button').on('tap', function(){
    doc.toggleTextmining(function( shown ){
      if( shown ){
        ui.focusWhenVisible( document.getElementById('textmining-text') );
      }
    });
  });

  $('#textmining-input').on('tap', '.add', function(){
    var $textarea = $('#textmining-text');
    var $button = $(this);
    var $container = $('#textmining-input');
    var text = $textarea.val();


    $container
      .addClass('loading')
      .removeClass('no-results')
    ;
    
    $button.attr('disabled', 'true');
    $textarea.attr('disabled', 'true');

    doc.addEntitiesFromText( text, cyutil.getNewEntityPosition, function( numEnts ){

      if( numEnts > 0 ){
        cyutil.relayout();
      } else {
        $container.addClass('no-results');
      }

      $container.removeClass('loading');
      $button.removeAttr('disabled');
      $textarea.removeAttr('disabled');
    } );
  });

});