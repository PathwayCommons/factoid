$(function(){
  $('body').on('tap', '.text-clear-icon', function(e){
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

  $('body').on('tap', '.text-search-icon', function(e){
    e.preventDefault();

    var $icon = $(this);
    var inputId = $icon.attr('data-for');
    var $input = $( document.getElementById(inputId) );

    $input.focus();
  });
});