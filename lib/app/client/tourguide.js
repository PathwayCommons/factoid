// code for shoowing the tour on page load

window.addEventListener('load', function(){
  var $overlay = $('#ui-loading-overlay');
  
  //$overlay.addClass('fade-out');
  setTimeout(function(){
    doc.indicateUiLoaded();
  }, 325);
});

$(function(){
  

return;
  $.tourguide('defaults', {
    //classes: 'animated pulse',
    scrollToTarget: false,
    showTitle: false
  });

  var buttons = '<div></div><div class="button-nav"><button class="tourguide-prev">Prev</button> <button class="tourguide-next">Next</button> <button class="tourguide-done">Done</button></div>';
  var skipText = '<div class="skip-nav"><span class="skip link-like small">Skip the whole tutorial</span></div>';

  $('html')
    .on('tap', '.tourguide .skip', function(){
      $.tourguide('finish');
      return false;
    })
  ;

  $('#graph').tourguide({
    classes: 'first-tourguide',
    my: 'left center',
    at: 'right center',
    content: 'This is the Factoid demo.  The area here to the left contains an interactive visualisation of the document.' + buttons + skipText
  });

  $('.extendo-container').tourguide({
    content: 'You can use this set of commands to edit the document.' + buttons + skipText
  });

  $('#entities-list').tourguide({
    modalTarget: $('#info'),
    my: 'right center',
    at: 'left center',
    content: 'This area contains a list of the entities and interactions in the document.  You can use this list to edit the entities and interactions.' + buttons + skipText
  });

  $('#info .button-panel').tourguide({
    classes: 'last-tourguide',
    content: 'You can use these buttons to add entities (+Entity), interactions (+Interaction), or entities and interactions from text &mdash; such as an abstract (+Text).' + buttons + skipText
  });

  $.tourguide('show');

});