// code for firing controller functions when events happen on the entities ui

$(function(){


  $('#entities-list')

    // remove entity when clicking the remove icon
    .on('tap', '.entity-instance > .icons > .remove', function(){
      var $icon = $(this);
      var $entity = $icon.parents('.entity-instance:first');
      var id = $entity.attr('data-id');

      doc.removeEntity( id );
    })

    // show edit ui on tap of edit icon
    .on('tap', '.entity-instance > .edit', function(){
      var $icon = $(this);
      var $entity = $icon.parents('.entity-instance:first');
      var id = $entity.attr('data-id');
      var $text = ui.editNameFor( id );
      var associated = doc.entityIsAssociated(id);

      $icon.showqtip({
        style: {
          classes: 'edit-entity-qtip ' + ( 'associated-' + associated )
        },
        content: {
          text: $text
        }
      });
    })

    // show the edit participants ui when tapping the icon
    .on('tap', '.entity-instance > .icons > .add-participants', function(){
      var $icon = $(this);
      var $entity = $icon.parents('.entity-instance:first');
      var id = $entity.attr('data-id');
      
      doc.showAddParticipants( id );
    })

    // disconnect participant on tap of icon
    .on('tap', '.participant > .icons > .remove', function(){
      var $icon = $(this);
      var $interaction = $icon.parents('.entity-instance:first');
      var intId = $interaction.attr('data-id');
      var $participant = $icon.parents('.participant:first');
      var partId = $participant.attr('data-id');

      doc.disconnectEntityFromInteraction( partId, intId );
    })
  ;

  $('body').on('tap', '.add-participants-list .add-participant', function(){
    var $button = $(this);
    var $participant = $button.parents('.participant:first');
    var $list = $participant.parents('.add-participants-list:first');
    var intId = $list.attr('data-interaction-id');
    var entId = $participant.attr('data-id');

    doc.connectEntityToInteraction(entId, intId);
  });

});