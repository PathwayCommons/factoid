$(function(){
  FastClick.attach(document.body);

  $(document).on('click', function(e){
    $(e.target).trigger('tap');
  });
});