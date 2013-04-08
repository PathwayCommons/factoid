// code for handling interactions with the info area (side bar)

$(function(){

  $('#add-entity-button').on('tap', function(){
    cyutil.addEntityInGoodPosition();
    doc.showEditForLastAdded(function(){
      ui.focusWhenVisible( 'edit-name-input-' + doc.getLastAddedEntity().id );
    });
  });

  $('#add-interaction-button').on('tap', function(){
    cyutil.addInteractionInGoodPosition();
    //doc.showEditForLastAdded();
  });

  var tmShown = false;
  $('#textmining-button').on('tap', function(){
    if( tmShown ){
      $('#textmining-text').blur();
    }

    //ui.maintainScrollTop( 'textmining-button', $('body'), function(){
      doc.toggleTextmining(function(shown){ 
        if( !shown ){ 
          tmShown = false;
        } else {
          ui.focusWhenVisible( 'textmining-text' ); 
          tmShown = true;
        }

           
      });
    //});
  });

  $('#textmining-input').on('tap', '.add', function(){
    var $textarea = $('#textmining-text');
    var $button = $(this);
    var $container = $('#textmining-input');
    var text = $textarea.val();
    var $overlay = $('#textmining-overlay');


    $container
      .addClass('loading')
      .removeClass('no-results')
    ;
    
    $button.attr('disabled', 'true');
    $textarea.attr('disabled', 'true');

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
    } );
  });

  $('#textmining-examples').on('tap', '.example', function(){
    var $ex = $(this);
    var text = $ex.attr('data-text');

    $('#textmining-text').val( text );
  });

});