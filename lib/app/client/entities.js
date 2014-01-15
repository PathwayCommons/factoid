// code for firing controller functions when events happen on the entities ui

$(function(){

  $(document)

    // remove entity when clicking the remove icon
    .on('tap enterkey', '.delete-all', function(e){ 
      doc.removeAllEntities();
      cy.reset();
    })

    // remove entity when clicking the remove icon
    .on('tap enterkey', '#entities-list .entity-instance > .icons > .remove', function(e){ 
      var $icon = $(this);
      var $entity = $icon.parents('.entity-instance:first');
      var id = $entity.attr('data-id');

      doc.removeEntity( id );
    })

    // show edit ui on tap of edit icon
    .on('tap enterkey', '#entities-list .entity-instance > .edit', function(){
      var $this = $(this);
      var $entity = $this.parents('.entity-instance:first');
      var id = $entity.attr('data-id');
      var $input = $('#' + 'edit-name-input-' + id);
      var name = $input.val();

      ui.maintainScrollTop( $entity.attr('id'), $('body'), function(){
        doc.toggleEdit( id, function( shown ){
          if( shown ){
            ui.focusWhenVisible( 'edit-name-input-' + id );

            if( doc.entityHasChangedName(id) ){
              doc.getAssociatedEntitiesFromQuery(id, name);
            }
          } else {
            $input.blur();
          }
        } );
      } );

    })

    // show edit ui on focus of edit name input box
    .on('focus', '#entities-list .entity-instance .edit-name-input', function(){
      var $this = $(this);
      var $entity = $this.parents('.entity-instance:first');
      var id = $entity.attr('data-id');
      var name = doc.entityName( id );

      ui.maintainScrollTop( $entity.attr('id'), $('body'), function(){
        doc.showEdit( id, function(shown){

          if( doc.entityHasChangedName(id) ){
            doc.getAssociatedEntitiesFromQuery(id, name);
          }

        } );
      } );

      // make all text selected on focus in
      setTimeout(function(){
        $this[0].select();
      }, 10);

    })

    // show edit ui on focus of plain name
    // .on('tap enterkey', '#entities-list .interaction .name', function(){
    //   return; // disable for now

    //   var $this = $(this);
    //   var $entity = $this.parents('.entity-instance:first');
    //   var id = $entity.attr('data-id');

    //   ui.maintainScrollTop( $entity.attr('id'), $('body'), function(){
    //     doc.showEdit( id );
    //   } );

    // })

    // show the edit participants ui when tapping the icon
    .on('tap enterkey', '#entities-list .entity-instance > .icons > .add-participants', function(){
      var $icon = $(this);
      var $entity = $icon.parents('.entity-instance:first');
      var id = $entity.attr('data-id');
      
      ui.maintainScrollTop( $entity.attr('id'), $('body'), function(){
        doc.toggleAddParticipants( id );
      } );
      
    })

    // show the annotations ui when tapping the icon
    .on('tap enterkey', '#entities-list .entity-instance > .icons .annotations', function(){

      var $icon = $(this);
      var $entity = $icon.parents('.entity-instance:first');
      var id = $entity.attr('data-id');
      
      ui.maintainScrollTop( $entity.attr('id'), $('body'), function(){
        doc.toggleAnnotations( id, function(shown){
          if( shown ){ ui.focusWhenVisible('edit-annotation-' + id) }
        } );
      } );
      
    })

    // show the annotations ui when tapping the icon
    .on('tap enterkey', '#entities-list .annotations-popover .clear-icon', function(){
      var $icon = $(this);
      var $entity = $icon.parents('.entity-instance:first');
      var id = $entity.attr('data-id');
      
      doc.removeAnnotations( id );
      
    })

    // disconnect participant on tap of icon
    .on('tap enterkey', '#entities-list .participant > .icons > .remove', function(){
      var $icon = $(this);
      var $interaction = $icon.parents('.entity-instance:first');
      var intId = $interaction.attr('data-id');
      var $participant = $icon.parents('.participant:first');
      var partId = $participant.attr('data-id');

      doc.disconnectEntityFromInteraction( partId, intId );
    })
  ;

  $('html').on('tap enterkey', '#entities-list .add-participants-list .add-participant', function(){
    var $button = $(this);
    var $participant = $button.parents('.participant:first');
    var $list = $participant.parents('.add-participants-list:first');
    var intId = $list.attr('data-interaction-id');
    var entId = $participant.attr('data-id');

    doc.connectEntityToInteraction(entId, intId);
  });

});