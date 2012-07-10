// code for handling interactions with the info area (side bar)

$(function(){

  $('#add-entity-button').on('click', function(){
    cyutil.addEntityInGoodPosition();
  });

  $('#add-interaction-button').on('click', function(){
    cyutil.addInteractionInGoodPosition();
  });

  $('#textmining-button').on('click', function(){
    // TODO mine text
  });

});