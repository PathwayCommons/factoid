$(function(){

  $('body').on('mousedown click touchstart touchend', _.throttle(function(e){
    var $target = $( e.target );


    var popoverOpen = doc.popoverIsOpen(); //$('.popover-hidden-false').length !== 0;

    if( !popoverOpen ){
      return; // then let's skip all the expensive dom checks
    }

    var isPopover = $target.hasClass('popover');
    var $parents = $target.parents();
    var parentIsPopover = $parents.filter('.popover').length !== 0;
    var $parent;
    var parentKeepsOpen = ( $parent = $parents.add( $target ).filter('[data-popover-keep-open]') ) && $parent.length !== 0 && $parent.children('.popover-hidden-false').length !== 0;

    var needToClose = ! (isPopover || parentIsPopover || parentKeepsOpen);
    if( needToClose ){
      doc.closeAllPopovers();
    }
  }, 16));

});