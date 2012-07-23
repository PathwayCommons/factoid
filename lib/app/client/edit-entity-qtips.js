$(function(){

  $('body').on('click', '.associate-button', function(){
    var $button = $(this);
    var id = $button.attr('data-entity-id');
    var db = $button.attr('data-db');
    var dbId = $button.attr('data-db-id');
    var name = $button.attr('data-name');

    doc.associateEntity( id, db, dbId, name );
  });

});