(function( $ ){

  // array of guides so we know how to sequence them
  var guides = [];
  var current = 0;

  var defaults = {
    scrollToTarget: true, // whether to scroll to the target on this tour step
    scrollContainer: 'body', // the container to scroll if we scroll to the target
    scrollPadding: 20, // padding on scroll so that it doesn't touch the window edge
    my: 'top center',    // -> the position of the tourguide tip
    at: 'bottom center', // -> as placed on the target's body
    nextButtonText: 'Next <span class="icon-angle-right"></span>', // button content for next
    prevButtonText: '<span class="icon-angle-left"></span> Prev', // button content for prev
    showTitle: true, // whether to show the title on the qtips
    title: '', // the title content
    content: '', // the content of the qtip at this tour step
    classes: '', // classes to add to the qtip
    qtip: {}, // options passed to the qtip plugin (not generally needed)
    modal: true, // whether to make the page modal (black bg) on this step
    modalTarget: undefined // a manual override to which element is highlighted when modal
  };

  function scrollTo( $ele, $container, padding ){
    var scrollTime = 500;
    var scrollPos = Math.max(0, $ele.offset().top - padding);

    // can't scroll to fixed divs
    if( $ele.css('position') === 'fixed' ){ return; }

    $container
      .stop( true )
      .animate({
        scrollTop: scrollPos
      }, scrollTime)
    ;
  }

  var $modalBg;
  var $interactionBg;
  function makeModal( $ele ){
    $interactionBg.show();

    $modalBg
      .css({
        'left': $ele.offset().left,
        'top': $ele.offset().top,
        'width': $ele.outerWidth(),
        'height': $ele.outerHeight(),
        'position': 'absolute',
        'border-radius': $ele.css('border-radius')
      })
      .show()
    ;

    if( $ele.css('position').toLowerCase() === 'fixed' ){
      $modalBg.css({
        'position': 'fixed',
        'left': $ele.css('left'),
        'right': $ele.css('right'),
        'top': $ele.css('top'),
        'bottom': $ele.css('bottom')
      })
    }
  }

  function removeModal(){
    $modalBg.hide();
    $interactionBg.hide();
  }

  var methods = {
    init: function( options ) {
      options = $.extend( {}, defaults, options );

      var id = guides.length;
      this.eq(0).each(function(){
       
        var $this = $(this);
        var data = $this.data('tourguide');

        // If the plugin hasn't been initialized yet
        if ( ! data ) {

          $this.data('tourguide', {
              target : $this,
              id: id,
              options: options
          });

          // set up the qtip
          $this.qtip( $.extend(true, {

            content: { 
              title: options.showTitle ? (id > 0 ? '<button class="tourguide-prev">' + options.prevButtonText + '</button> ' : '') + options.title + ' <button class="tourguide-next">' + options.nextButtonText + '</button>' : undefined,
              text: options.content
            },

            position: {
              my: options.my,
              at: options.at,
              effect: false,
              viewport: true,
              adjust: {
                method: 'shift flipinvert flip'
              }
            },

            show: {
              event: 'showtourguide',
              delay: 0,
              solo: false,
              effect: false
            },

            hide: {
              event: 'click touchstart hidetourguide',
              delay: 0,
              fixed: true,
              leave: false,
              effect: false
            },

            style: {
              classes: 'tourguide ' + options.classes,

              tip: {
                height: 10,
                width: 20
              }
            }
          }, options.qtip) ); // qtip

          // add to the list of guides
          guides[id] = $this;



        } // if
      }); // each

      return this;
    }, // init

    show: function(){
      return this.each(function(){
        var $this = $(this);
        var options = $this.data('tourguide').options;

        $this.trigger('showtourguide');
        if( options.scrollToTarget ){ scrollTo( $this, $(options.scrollContainer), options.scrollPadding ); }

        if( options.modal ){ makeModal( $(options.modalTarget || $this) ) }
      });
    },

    hide: function(){
      return this.each(function(){
        $(this).trigger('hidetourguide');

        removeModal();
      });
    }
  };

  $(function(){
    $modalBg = $('<div class="tourguide-modal-bg"></div>');
    $('body').append( $modalBg );
    $modalBg.hide();

    $interactionBg = $('<div class="tourguide-modal-inactive-maker"></div>');
    $('body').append( $interactionBg );
    $interactionBg.hide();

    $('body').on('click touchstart', '.tourguide', function(e){
      var $target = $(e.target);

      if( $target.hasClass('tourguide-prev') ){
        $.tourguide('prev');
      } else {
        $.tourguide('next');
      }
    })
  });

  $.fn.tourguide = function( method ) {
    
    if ( methods[method] ) {
      return methods[method].apply( this, Array.prototype.slice.call( arguments, 1 ));
    } else if ( typeof method === 'object' || ! method ) {
      return methods.init.apply( this, arguments );
    } else {
      $.error( 'Method ' +  method + ' does not exist on jQuery.tourguide' );
    }    
  
  };


  var globalMethods = {

    show: function(){
      guides[current].tourguide('show');

      return this;
    },

    hide: function(){
      guides[current].tourguide('hide');

      return this;
    },

    next: function(){
      guides[current].tourguide('hide');

      if( current < guides.length - 1 ){
        current++;
        guides[current].tourguide('show');
      }
    },

    prev: function(){
      guides[current].tourguide('hide');

      if( current > 0 ){
        current--;
        guides[current].tourguide('show');
      }
    },

    reset: function(){
      current = 0;
      $.tourguide('hide');
    },

    clear: function(){
      $.tourguide('hide');
      guides = [];
    },

    defaults: function( newDefs ){
      defaults = $.extend( {}, defaults, newDefs );
    },

    finish: function(){
      $.tourguide('hide');
      $.tourguide('reset');
    }

  };

  $.tourguide = function( method ) {
    var methods = globalMethods;

    if ( methods[method] ) {
      return methods[method].apply( this, Array.prototype.slice.call( arguments, 1 ));
    } else if ( typeof method === 'object' || ! method ) {
      return methods.init.apply( this, arguments );
    } else {
      $.error( 'Method ' +  method + ' does not exist on jQuery.tourguide' );
    }    
  
  };

})( jQuery );

