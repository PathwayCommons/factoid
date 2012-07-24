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

  focusWhenVisible: function( ele ){
    var $ele = $(ele);

    var interval = setInterval(function(){
      if( $ele.is(':visible') ){
        clearInterval( interval );
        $ele.focus();
      }
    }, 8);
  },

  editNameFor: function( entityId ){
    return function(){

      var updateDelay = 100; // TODO adjust based on touch device
      var isInteraction = doc.entityIsInteraction( entityId );
      var isAlreadyAssociated = doc.entityIsAssociated( entityId );

      // build the html
      var $div = $('<div data-entity-id="' + entityId + '" class="associated-' + isAlreadyAssociated + '"></div>');
      var $specify = $('<div class="specify"></div>');
      $div.append( $specify );

      $specify.append('<h3>Specify entity</h3>');

      // build the input
      var inputId = 'name-input-with-rand-id-' + (+new Date) + '-' + Math.round( Math.random() * 1000 );
      var $input = $('<input id="' + inputId + '" class="name-input with-remove-icon" type="text"></input>');
      $specify.append( $input );
      $input.before('<span class="text-clear-icon icon-remove-sign" data-for="' + inputId + '"></span>');

      // build the association area 
      var $ui = $( document.getElementById('entity-' + entityId) ).find('.association-ui:first').derbyClone();
      var lastChangeTime = 0;
      $div.append( $ui );

      // now add the edit logic...

      var lastName = doc.entityName(entityId);
      $input.val( lastName ); // set initial name-input

      var onInputChange = _.debounce(function(){
        var name = $input.val();
        if( name === lastName ){ return; } // then we don't need to do anything
        lastName = name;

        var nameIsEmpty = name === '' || name.match(/^\s*$/);
        if( !nameIsEmpty ){

          doc.entityName( entityId, name ); // update the name on type
          var thisChangeTime = lastChangeTime = +new Date; // time in unix epoch

          if( !isInteraction ){
            $div.addClass('loading');

            textmining.getAssociatedEntitiesFromQuery(name, function(err, entities){
              var thisQueryIsTheLatestOne = thisChangeTime >= lastChangeTime;
              if( !thisQueryIsTheLatestOne ){ return; } // ignore if the query is old

              doc.setPotentialAssociationsForEntity( entityId, entities );
              $div.removeClass('loading');
            });
          }

        } // if name not empty
      
      }, updateDelay); // debounce

      // do an initial update based on w/e the current name is
      //onInputChange();

      // update the name when the input changes
      $input.on('keyup change paste', onInputChange);

      // disable for now since idk how this would fit with the association ui
      // $input.on('keydown', function(e){ // on <ENTER>, close the qtip
      //   if( e.which === 13 ){
      //     $div.trigger('hideqtip');
      //   }
      // });

      if( !isAlreadyAssociated ){
        ui.focusWhenVisible( $input );
      }
      return $div;
    };
  }

};