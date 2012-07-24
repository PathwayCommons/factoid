$(function(){

  $('body').on('click', '.associate-button', function(){
    var $button = $(this);
    var id = $button.parents('.associations:first').attr('data-entity-id');
    var db = $button.attr('data-db');
    var dbId = $button.attr('data-db-id');
    var name = $button.attr('data-name');

    doc.associateEntity( id, db, dbId, name );
  });

  function updateQtips(id, associated){
    var $qtips = $('body').children('.edit-entity-qtip');

    for( var i = 0; i < $qtips.length; i++ ){
      var $qtip = $( $qtips[i] );
      var $container = $qtip.find('[data-entity-id]:first');
      var entityId = $container.attr('data-entity-id');
      var needToUpdate = id === entityId;

      if( needToUpdate ){

        if( associated ){
          $qtip
            .addClass('associated-true')
            .removeClass('associated-false')
          ;
        } else {
          $qtip
            .removeClass('associated-true')
            .addClass('associated-false')
          ;
        }
      
      } // if needs update

    } // for
  }

  doc.associateEntity(function(id, db, dbId, name){
    updateQtips(id, true);
  });

});