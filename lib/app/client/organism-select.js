$(function(){

  $('html').on('tap', '.organism-qtip .organism', function(){
    var $org = $(this);
    var id = $org.attr('data-id');

    doc.toggleOrganism( id );
  });

});