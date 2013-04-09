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

    $interactionBg.css('z-index', '');

    $modalBg
      .css({
        'left': $ele.offset().left,
        'top': $ele.offset().top,
        'width': $ele.outerWidth(),
        'height': $ele.outerHeight(),
        'position': 'absolute',
        'border-radius': $ele.css('border-radius'),
        'z-index': ''
      })
    ;

    if( $ele.css('position').toLowerCase() === 'fixed' ){
      $modalBg.css({
        'position': 'fixed',
        'left': $ele.css('left'),
        'right': $ele.css('right'),
        'top': $ele.css('top'),
        'bottom': $ele.css('bottom'),
        'z-index': ''
      })
    }
  }

  function removeModal(){
    $modalBg.css('z-index', -1);
    $interactionBg.css('z-index', -1);
  }

  var methods = {
    init: function( options ) {
      options = $.extend( {}, defaults, options );

      if( !$modalBg || !$interactionBg ){
        $modalBg = $('<div class="tourguide-modal-bg"></div>');
        $('html').append( $modalBg );

        $interactionBg = $('<div class="tourguide-modal-inactive-maker"></div>');
        $('html').append( $interactionBg );

        $('html').on($.tourguide.event, '.tourguide', function(e){
          var $target = $(e.target);

          if( $target.hasClass('tourguide-prev') ){
            $.tourguide('prev');
          } else {
            $.tourguide('next');
          }
        });
      }

      var $fakeCaller = $('<div style="z-index: -1; opacity: 0;"></div>');
      $( options.container || 'body' ).append( $fakeCaller );

      var id = guides.length;
      this.eq(0).each(function(){
       
        var $this = $(this);

          // set up the qtip
          $fakeCaller.qtip( $.extend(true, {

            prerender: true,

            content: { 
              title: options.showTitle ? (id > 0 ? '<button class="tourguide-prev">' + options.prevButtonText + '</button> ' : '') + options.title + ' <button class="tourguide-next">' + options.nextButtonText + '</button>' : undefined,
              text: options.content
            },

            position: {
              target: options.modal ? $modalBg : $this,
              container: options.container ? $(options.container) : undefined,
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
              event: 'hidetourguide',
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

          var $container = ( options.container ? $(options.container) : $('body') );
          var $qtip = $container.children('.qtip:last');

          options.qtip = $qtip;

          // add to the list of guides
          guides[id] = {
            target: $this,
            options: options
          }

      }); // each

      return this;
    }, // init

    show: function(options){
      return this.each(function(){
        var $this = $(this);

        options.beforeShow && options.beforeShow();

        if( options.scrollToTarget ){ scrollTo( $this, $(options.scrollContainer), options.scrollPadding ); }

        if( options.modal ){ makeModal( $(options.modalTarget || $this) ) }

        setTimeout(function(){
          options.qtip.qtip('show');

          options.afterShow && options.afterShow();
        }, 0)
       
      });
    },

    hide: function(options){
      return this.each(function(){
        options.beforeHide && options.beforeHide();

        options.qtip.qtip('hide');
        removeModal();

        options.afterHide && options.afterHide();
      });
    }
  };

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
      guides[current].target.tourguide('show', guides[current].options);

      return this;
    },

    hide: function(){
      guides[current].target.tourguide('hide', guides[current].options);

      return this;
    },

    next: function(){
      guides[current].target.tourguide('hide', guides[current].options);

      if( current < guides.length - 1 ){
        current++;
        guides[current].target.tourguide('show', guides[current].options);
      }
    },

    prev: function(){
      guides[current].target.tourguide('hide', guides[current].options);

      if( current > 0 ){
        current--;
        guides[current].target.tourguide('show', guides[current].options);
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

  $.tourguide.event = 'click touchstart';

})( jQuery );

