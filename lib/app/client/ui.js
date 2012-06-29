// useful, reusable ui stuff
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

      return $div;
    };
  }

};