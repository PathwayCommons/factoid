// code for handling interactions with the info area (side bar)

$(function(){

  $('html').on('tap', '#add-entity-button', function(){
    cyutil.addEntityInGoodPosition();
    doc.showEditForLastAdded(function(){
      ui.focusWhenVisible( 'edit-name-input-' + doc.getLastAddedEntity().id );
    });
  });

  $('html').on('tap', '#add-interaction-button', function(){
    cyutil.addInteractionInGoodPosition();
    //doc.showEditForLastAdded();
  });

  var tmShown = false;
  $('html').on('tap', '#textmining-button', function(){
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

  $('html').on('tap', '#textmining-input .add', function(){
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

  $('html').on('tap', '#textmining-examples .example', function(){
    var $ex = $(this);
    var text = $ex.attr('data-text');

    $('#textmining-text').val( text );
  });

});