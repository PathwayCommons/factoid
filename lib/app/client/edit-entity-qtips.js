$(function(){

  var DOWN_KEY = 40;
  var UP_KEY = 38;

  $('body').on('tap', '.associate-button', function(){
    var $button = $(this);
    var id = $button.parents('.associations:first').attr('data-entity-id');
    var index = $button.attr('data-index');

    doc.associateEntityWithPotentialAtIndex( id, index );
  });

  function focusAssociationButton( $assocs, offset ){
    var $buttons = $assocs.children();
    var $current = $buttons.filter(':focus');
    var $button;
    var $from;
    var scrollTime = 250;

    if( $current.length === 0 ){
      if( offset > 0 ){
        offset--;
      }

      $from = $buttons;

    } else if( offset > 0 ){
      $from = $current.add( $current.nextAll() )

    } else {
      offset = -offset - 1;
      $from = $current.prevAll();
    }

    var $focussed = $from.eq( offset ).focus();

    if( $focussed.length === 0 ){
      return; // then we can't do anything
    }

    var scrollToTop = $focussed.offset().top - $assocs.offset().top + $assocs.scrollTop();
    var offsetToCenter = ( $assocs.height() - $focussed.height() )/2;
    var scrollPos = scrollToTop - offsetToCenter;

    $assocs
      .stop( true )
      .animate({
        scrollTop: scrollPos
      }, scrollTime, 'easeOutCubic')
    ;
  }

  $('body').on('keydown', '.name-input', function(e){
    if( e.which !== DOWN_KEY ){ return; } // exit early on erroneous key

    var $this = $(this);
    var $input = $this;
    var $assocs = $input.parents('.specify').parent().find('.associations:first');

    focusAssociationButton( $assocs, 1 );

    e.preventDefault();
  });

  $('body').on('keydown', '.associations', function(e){
    if( e.which !== DOWN_KEY && e.which !== UP_KEY ){ return; } // exit early on erroneous key

    var $assocs = $(this);
    var $buttons = $assocs.children();
    var $focussed = $buttons.filter(':focus');
    var focussedIsFirst = $focussed.length !== 0 && $focussed.prev().length === 0;
    
    if( focussedIsFirst && e.which === UP_KEY ){ // then focus the text input
      $assocs.parents('.association-ui:first').parent().find('.name-input').focus();
    
    } else { // just move up and down
      switch( e.which ){
      case DOWN_KEY:
        focusAssociationButton( $assocs, 1 );
        break;

      case UP_KEY:
        focusAssociationButton( $assocs, -1 );
        break;
      }
    }

    e.preventDefault();
  });

  function updateQtips(id, associated){
    var $qtips = $('body').children('.edit-entity-qtip');

    for( var i = 0; i < $qtips.length; i++ ){
      var $qtip = $( $qtips[i] );
      var $container = $qtip.find('[data-entity-id]:first');
      var entityId = $container.attr('data-entity-id');
      var needToUpdate = id === entityId;

      if( needToUpdate ){

        if( associated ){
          $qtip
            .addClass('associated-true')
            .removeClass('associated-false')
          ;
        } else {
          $qtip
            .removeClass('associated-true')
            .addClass('associated-false')
          ;
        }
      
      } // if needs update

    } // for
  }

  doc.associateEntityWithPotentialAtIndex(function(id){
    updateQtips(id, true);
  });

});