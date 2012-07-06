$(function(){

  // TODO refactor these 'click' events for mobile
  // maybe when cytoscape.js supports zepto? (prob better than jquery for mobile)

  $('#entities-list')

    // remove entity when clicking the remove icon
    .on('click', '.entity-instance > .icons > .remove', function(){
      var $icon = $(this);
      var $entity = $icon.parents('.entity-instance:first');
      var id = $entity.attr('data-id');

      doc.removeEntity( id );
    })

    // show edit ui on click of edit icon
    .on('click', '.entity-instance > .edit', function(){
      var $icon = $(this);
      var $entity = $icon.parents('.entity-instance:first');
      var id = $entity.attr('data-id');

      $icon.showqtip({
        content: {
          text: ui.editNameQtipContent(id) 
        }
      });
    })

    // show the edit participants ui when clicking the icon
    .on('click', '.entity-instance > .icons > .add-participants', function(){
      var $icon = $(this);
      var $entity = $icon.parents('.entity-instance:first');
      var id = $entity.attr('data-id');

      $icon.showqtip({
        content: {
          text: ui.editParticipantsQtipContent(id) 
        }
      });
    })

    // disconnect participant on click of icon
    .on('click', '.participant > .icons > .remove', function(){
      var $icon = $(this);
      var $interaction = $icon.parents('.entity-instance:first');
      var intId = $interaction.attr('data-id');
      var $participant = $icon.parents('.participant:first');
      var partId = $participant.attr('data-id');

      doc.disconnectEntityFromInteraction( partId, intId );
    })
  ;

});