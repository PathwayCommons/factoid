$(function(){

  $('html').on('tap enterkey', '.organism', function(){
    var $org = $(this);
    var id = $org.attr('data-id');

    doc.toggleOrganism( id );
  });

});