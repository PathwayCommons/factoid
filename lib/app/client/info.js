$(function(){

  $('#add-entity-button').on('click', function(){
    doc.addEntity({
      viewport: cyutil.getNewEntityPosition()
    });
  });

  $('#add-interaction-button').on('click', function(){
    doc.addInteraction();
  });

  $('#textmining-button').on('click', function(){
    // TODO mine text
  });

});