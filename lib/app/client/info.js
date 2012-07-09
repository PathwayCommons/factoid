// code for handling interactions with the info area (side bar)

$(function(){

  $('#add-entity-button').on('click', function(){
    doc.addEntity({
      viewport: cyutil.getNewEntityPosition()
    });
  });

  $('#add-interaction-button').on('click', function(){
    doc.addInteraction({
      viewport: cyutil.getNewEntityPosition()
    });
  });

  $('#textmining-button').on('click', function(){
    // TODO mine text
  });

});