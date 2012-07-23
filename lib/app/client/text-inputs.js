$(function(){
  $('body').on('mousedown', '.text-clear-icon', function(e){
    e.preventDefault();

    var $icon = $(this);
    var inputId = $icon.attr('data-for');
    var $input = $( document.getElementById(inputId) );

    $input
      .val('')
      .trigger('change')
      .focus()
    ;
  });
});