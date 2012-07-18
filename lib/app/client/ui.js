// useful, reusable ui components

window.ui = {

  // TODO see if we can move the edit and association ui to the template so derby
  // can keep track of state for us

  associatedInfoFor: function( entityId, info ){
    return function(){
      var $div = $('<div class="entity-info"></div>');

      function addInfo(info){
        var $summary = $('<div class="summary"></div>');
        var $name = $('<div class="name">' + info.name + '</div>');
        var $fullName = $('<div class="full-name">' + info.fullName + '</div>');
        var $organism = $('<div class="organism">' + info.organismName + '</div>');
        var $type = $('<div class="type">' + info.type + '</div>');
        $summary
          .append( $type )
          .append( $name )
          .append( $fullName )
          .append( $organism )
        ;

        var $func = $('<p class="function">' + info['function'] + '</p>');

        var $link = $('<p class="link"><a target="_blank" href="' + info.link + '">More info at UniProt</a></p>');

        $div
          .append( $summary )
          .append( $link )
          .append( $func )
        ;
      }

      if( !info ){ // then load it and add it
        $div.addClass('loading');
        textmining.getEntityInfo(doc.entity(entityId), function(err, info){
          addInfo(info);
          $div.removeClass('loading');
        });
      } else { // just add it
        addInfo(info);
      }

      return $div;
    }
  },

  editNameFor: function( entityId, showAssociationUI ){
    return function(){

      // build the html
      var $div = $('<div></div>');

      $div.append('<h3>Specify entity</h3>');

      // build the input
      var inputId = 'name-input-for-' + entityId;
      var $input = $('<input class="name-input" id="' + inputId + '" type="text"></input>');
      $div.append( $input );

      // build the association area 
      var $associations = $('<div class="associations"></div>');
      var lastChangeTime = 0;
      $div.append( $associations );

      // now add the edit logic
      $input.val( doc.entityName(entityId) ); // set initial name-input

      var lastName = '';
      var onInputChange = _.debounce(function(){
        var name = $input.val();
        if( name === lastName ){ return; } // why waste our time?
        lastName = name;

        doc.entityName( entityId, name );
        var thisChangeTime = lastChangeTime = +new Date; // time in unix epoch

        if( showAssociationUI ){ // then get a list of potential associations
          $div.addClass('loading');

          textmining.getAssociatedEntitiesFromQuery(name, function(err, entities){
            var thisQueryIsTheLatestOne = thisChangeTime >= lastChangeTime;
            if( !thisQueryIsTheLatestOne ){ return; }

            $associations.empty();
            var $assocs = $();
            
            for( var i = 0; i < entities.length; i++ ){
              var entity = entities[i];

              var $assoc = $('<button class="associate-button"></button>').attr({
                'data-entity-id': entityId,
                'data-db': entity.db,
                'data-db-id': entity.id,
                'data-name': entity.name
              });
              $assocs = $assocs.add( $assoc );

              var $name = $('<div class="name"><span class="icon-ok"></span> ' + entity.name + '</div>');
              var $fullName = $('<div class="full-name">' + entity.fullName + '</div>');
              var $organism = $('<div class="organism">' + entity.organismName + '</div>');
              var $type = $('<div class="type">' + entity.type + '</div>');
              $assoc
                .append( $type )
                .append( $name )
                .append( $fullName )
                .append( $organism )
              ;

              (function( info ){ // pass info into current scope, since we'll lose it on next loop iter.
                $assoc.on('click', function(){
                  var $assoc = $(this);
                  var entId = $assoc.attr('data-entity-id');
                  var db = $assoc.attr('data-db');
                  var dbId = $assoc.attr('data-db-id');
                  var name = $assoc.attr('data-name');

                  // associate the entity and replace the content with the associated entity ui
                  doc.associateEntity( entityId, db, dbId, name );
                  $div.before( (ui.associatedInfoFor(entityId, info))() ).remove();
                });
              })( entity );

            }

            $associations.append( $assocs );
            $div.removeClass('loading');
          });
        }
      }, 100);

      // do an initial update based on w/e the current name is
      onInputChange();

      // update the name when the input changes
      $input.on('keyup change paste', onInputChange);

      // disable for now since idk how this would fit with the association ui
      // $input.on('keydown', function(e){ // on <ENTER>, close the qtip
      //   if( e.which === 13 ){
      //     $div.trigger('hideqtip');
      //   }
      // });

      setTimeout(function(){ // give the input focus by default
        $input.focus();
      }, 100);
      return $div;
    };
  }

};