$(function(){

  $('#entities-list')
    .on('click', '.remove', function(){
      var $icon = $(this);
      var $entity = $icon.parents('.entity-instance:first');
      var id = $entity.attr('data-id');

      doc.removeEntity( id );
    })

    .on('click', '.edit-name', function(){
      var $icon = $(this);
      var $entity = $icon.parents('.entity-instance:first');
      var id = $entity.attr('data-id');

      $icon.showqtip({
        content: {
          text: ui.editNameQtipContent(id) 
        }
      });
    })

    .on('click', '.edit-participants', function(){
      var $icon = $(this);
      var $entity = $icon.parents('.entity-instance:first');
      var id = $entity.attr('data-id');

      $icon.showqtip({
        content: {
          text: ui.editParticipantsQtipContent(id) 
        }
      });
    })
  ;

});