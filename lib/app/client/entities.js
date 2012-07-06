$(function(){

  // TODO refactor these 'click' events for mobile
  // maybe when cytoscape.js supports zepto? (prob better than jquery for mobile)

  function makeDomClone( $ele ){
    var $clone = $ele.clone( false );
    $clone.find('*').andSelf().removeAttr('id'); // don't want ids to cause collisions
    return $clone;
  }

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
      var $potParts = $entity.find('.add-participants-list:first');
      var $text = makeDomClone( $potParts );

      $icon.showqtip({
        style: {
          classes: 'add-participants-qtip'
        },
        content: {
          title: 'Add participants',
          text: $text
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

  $('body').on('click', '.add-participants-list button', function(){
    var $button = $(this);
    var $participant = $button.parents('.participant:first');
    var $list = $participant.parents('.add-participants-list:first');
    var intId = $list.attr('data-interaction-id');
    var entId = $participant.attr('data-id');

    doc.connectEntityToInteraction(entId, intId);
  });

  // update add participant qtips when they could chnage in content
  function updateAddParticipantQtips(){
    var $qtips = $('.add-participants-qtip:visible');

    for( var i = 0; i < $qtips.length; i++ ){ // for each qtip
      var $qtip = $( $qtips[i] );
      var $qtipContent = $qtip.find('.ui-tooltip-content');
      var $qtipPotParts = $qtipContent.find('.add-participants-list:first');
      var interId = $qtipPotParts.attr('data-interaction-id');
      var $potParts = $( document.getElementById('add-participants-list-for-' + interId) );
      var $clone = makeDomClone( $potParts );

      $qtipContent.html( $clone );
    }
  }
  doc.connectEntityToInteraction(updateAddParticipantQtips);
  doc.disconnectEntityFromInteraction(updateAddParticipantQtips);
  doc.removeEntity(updateAddParticipantQtips);
  doc.addEntity(updateAddParticipantQtips);

});