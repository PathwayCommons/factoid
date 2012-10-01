// useful, reusable ui components

window.ui = {

  focusWhenVisible: function( ele ){
    var $ele = $(ele);

    var interval = setInterval(function(){
      if( $ele.is(':visible') ){
        clearInterval( interval );
        $ele.focus();
      }
    }, 8);
  },

  maintainScrollTop: function( id, $container, fn ){
    var $ele = function(){
      return $( document.getElementById(id) );
    };  

    var distFromTop = $ele().position().top;

    fn();

    var top = $container.scrollTop();
    var newDistFromTop = $ele().position().top;
    var delta = newDistFromTop - distFromTop;

    $container.scrollTop( top + delta );
  },

  editNameFor: function( entityId ){
    return function(){

      var updateDelay = 250; // TODO adjust based on touch device
      var isInteraction = doc.entityIsInteraction( entityId );
      var isAlreadyAssociated = doc.entityIsAssociated( entityId );

      // build the html
      var $div = $('<div data-entity-id="' + entityId + '" class="associated-' + isAlreadyAssociated + '"></div>');
      var $specify = $('<div class="specify"></div>');
      $div.append( $specify );

      // build the input
      var inputId = 'name-input-with-rand-id-' + (+new Date) + '-' + Math.round( Math.random() * 1000 );
      var $input = $('<input id="' + inputId + '" class="name-input with-right-icon" type="text"></input>');
      $specify.append( $input );
      $input.before('<span class="text-clear-icon icon-remove-sign" data-for="' + inputId + '"></span>');
      //$input.before('<span class="text-search-icon icon-search" data-for="' + inputId + '"></span>');

      // build the association area 
      var $ui = $( document.getElementById('entity-' + entityId) ).find('.association-ui:first').derbyClone();
      var lastChangeTime = 0;
      $div.append( $ui );

      // now add the edit logic...

      var entityHasChangedName = doc.entityHasChangedName( entityId );
      var lastName = entityHasChangedName ? doc.entityName(entityId) : undefined;
      $input.val( lastName ); // set initial name-input

      var $qtip;

      var onInputChange = _.debounce(function(){ // update the textmining
        var name = $input.val();
        var entityHasPotentialAssociations = doc.entityHasPotentialAssociations( entityId );
        entityHasChangedName = doc.entityHasChangedName( entityId );
        var inputHasChanged = name !== lastName;

        lastName = name;

        var nameIsEmpty = name === '' || name.match(/^\s*$/);
        if( nameIsEmpty ){
          lastChangeTime = +new Date; // don't update via any queued textmining since we have nothing now
        
        } else if( inputHasChanged ){
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

        } else if( entityHasChangedName && !entityHasPotentialAssociations ){
          $div.addClass('loading');

          textmining.getAssociatedEntitiesFromQuery(name, function(err, entities){
            doc.setPotentialAssociationsForEntity( entityId, entities );
            $div.removeClass('loading');
          });
        }

        $qtip = $qtip || $input.parents('.qtip:first');
        var insideQtip = $qtip.length !== 0;
        if( insideQtip ){
          //$qtip.qtip('api').reposition();
          //console.log('inside and repos');
        }

      }, updateDelay); // onInputChange

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

      if( isAlreadyAssociated ){ // then load the associated info from textmining
        if( !doc.entityAssociatedInfoIsLoaded(entityId) ){ // then we need to load it
          setTimeout(function(){
            doc.loadAssociatedInfoForEntity( entityId );
          }, 16);
        }

      } else { // then just make the name input focussed
        ui.focusWhenVisible( $input );
      }

      return $div;
    };
  }

};