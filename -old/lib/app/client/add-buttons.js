// code for handling interactions with the info area (side bar)

$(function(){

  $('html').on('tap enterkey', '#add-entity-button', function(){
    cyutil.addEntityInGoodPosition();
    doc.showEditForLastAdded(function(){
      ui.focusWhenVisible( 'edit-name-input-' + doc.getLastAddedEntity().id );
    });
  });

  $('html').on('tap enterkey', '#add-interaction-button', function(){
    cyutil.addInteractionInGoodPosition();
    //doc.showEditForLastAdded();
  });

  var tmShown = false;
  $('html').on('tap enterkey', '#textmining-button', function(){
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

});