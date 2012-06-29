$(function(){

  $('#entities-list')
    .on('click', '.remove', function(){
      var $icon = $(this);
      var $entity = $icon.parents('.type:first');
      var id = $entity.attr('id');

      doc.removeEntity( id );
    })

    .on('click', '.edit-name', function(){
      var $icon = $(this);
      var $entity = $icon.parents('.type:first');
      var id = $entity.attr('id');

      $icon.showqtip({
        content: {
          text: ui.editNameQtipContent(id) 
        }
      });
    })

    .on('click', '.edit-participants', function(){
      var $icon = $(this);
      var $entity = $icon.parents('.type:first');
      var id = $entity.attr('id');

      $icon.showqtip({
        content: {
          text: ui.editParticipantsQtipContent(id) 
        }
      });
    })
  ;

});