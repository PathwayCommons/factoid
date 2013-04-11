// code for shoowing the tour on page load

window.addEventListener('load', function(){
  var $overlay = $('#ui-loading-overlay');
  
  //$overlay.addClass('fade-out');
  setTimeout(function(){
    doc.indicateUiLoaded();

    // disable tourguide until script can be finalised (textmining webservices need to be up to test)
    //startTour();
  }, 325);
});

function startTour(){
  
  $.tourguide('defaults', {
    //classes: 'animated pulse',
    scrollToTarget: false,
    showTitle: false,
    container: 'html'
  });

  $.tourguide.event = 'tap';

  var buttons = '<div></div><div class="button-nav"><button class="tourguide-prev">Prev</button> <button class="tourguide-next">Next</button> <button class="tourguide-done">Done</button></div>';
  var skipText = '<div class="skip-nav"><span class="skip link-like small">Skip the whole tutorial</span></div>';

  $('html')
    .on($.tourguide.event, '.tourguide .skip', function(e){
      $.tourguide('finish');

      e.stopPropagation();
      e.preventDefault();
      return false;
    })
  ;

  $('html').tourguide({
    modalTarget: '#textmining-button',
    classes: 'first-tourguide',
    my: 'top center',
    at: 'bottom center',
    content: 'This is the Factoid demo.  We generally start by adding entities and interactions to the document via text.' + buttons + skipText
  });

  $('html').tourguide({
    beforeShow: function(){
      doc.showTextmining();
      $('#textmining-examples .example:first').trigger('tap');
    },
    modalTarget: '#tools',
    my: 'right center',
    at: 'left center',
    content: 'The text you want to use is filled in here.  For now, we\'ll use an example abstract.' + buttons + skipText
  });

  $('.extendo-container').tourguide({
    content: 'You can use this set of commands to edit the document.' + buttons + skipText
  });


  $.tourguide('show');

}