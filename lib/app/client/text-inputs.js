$(function(){
  $('body').on('vmousedown', '.text-clear-icon', function(e){
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

  $('body').on('vmousedown', '.text-search-icon', function(e){
    e.preventDefault();

    var $icon = $(this);
    var inputId = $icon.attr('data-for');
    var $input = $( document.getElementById(inputId) );

    $input.focus();
  });
});