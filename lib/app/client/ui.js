// useful, reusable ui stuff
// TODO this will need to be refactored or removed after the cytoscape.js qtip ui is done

window.ui = {

  editNameQtipContent: function( entityId ){
    return function(){

      // build the html
      var inputId = entityId + '-name-input';
      var $div = $('<div></div>');
      var $input = $('<input id="' + inputId + '" type="text"></input>');
      var $label = $('<label for="' + inputId + '">Name</label>');
      $div.append( $label ).append( $input );

      // now add the edit logic
      $input.val( doc.entityName(entityId) ); // set initial name

      $input.on('keyup change paste', _.debounce(function(){
        var name = $input.val();
        doc.entityName( entityId, name );
      }, 100));

      $input.on('keydown', function(e){
        if( e.which === 13 ){
          $div.trigger('hideqtip');
        }
      });

      setTimeout(function(){
        $input.focus();
      }, 100);
      return $div;
    };
  },

  editParticipantsQtipContent: function( interactionId ){
    return function(){
      var $div = $('<div class="participants-list"></div>');
      
      var entities = doc.entities();
      $.each(entities, function(i, entity){
        if( entity.id === interactionId ){ return; } // can't link to self

        var $entity = $('<div class="entity">' + entity.name + '</div>');
        $entity.attr('entid', entity.id);
        $entity.addClass( doc.interactionHasParticipant(interactionId, entity.id) ? 'connected' : '' );
        $div.append( $entity );

        $entity.bind('click', function(){
          var $this = $(this);
          entityId = $this.attr('entid');

          console.log(entityId, interactionId);

          if( !doc.interactionHasParticipant( interactionId, entityId ) ){
            doc.connectEntityToInteraction( entityId, interactionId );
            $this.addClass('connected');
          } else {
            doc.disconnectEntityFromInteraction( entityId, interactionId );
            $this.removeClass('connected');
          }
        });
      }); // each

      return $div;
    };
  }

};