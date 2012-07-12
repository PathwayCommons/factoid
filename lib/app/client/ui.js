// useful, reusable ui components

window.ui = {

  editNameFor: function( entityId, showAssociationUI ){
    return function(){

      // build the html
      var $div = $('<div></div>');

      // build the input
      var inputId = 'name-input-for-' + entityId;
      var $input = $('<input id="' + inputId + '" type="text"></input>');
      $div.append( $input );

      // build the association area 
      var $associations = $('<div class="associations"></div>');
      var lastChangeTime = 0;
      $div.append( $associations );

      // now add the edit logic
      $input.val( doc.entityName(entityId) ); // set initial name-input

      // update the name when the input changes
      $input.on('keyup change paste', _.debounce(function(){
        var name = $input.val();
        doc.entityName( entityId, name );
        lastChangeTime = +new Date; // time in unix epoch

        if( showAssociationUI ){ // then get a list of potential associations
          
        }
      }, 1000/60));

      $input.on('keydown', function(e){ // on <ENTER>, close the qtip
        if( e.which === 13 ){
          $div.trigger('hideqtip');
        }
      });

      setTimeout(function(){ // give the input focus by default
        $input.focus();
      }, 100);
      return $div;
    };
  }

};