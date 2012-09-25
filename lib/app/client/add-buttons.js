// code for handling interactions with the info area (side bar)

$(function(){

  $('#add-entity-button').on('tap', function(){
    cyutil.addEntityInGoodPosition();
  });

  $('#add-interaction-button').on('tap', function(){
    cyutil.addInteractionInGoodPosition();
  });

  // prepare content for textmining area
  var $textminingUi = $('<div></div>');
  var $tmEntitiesUi = $('#textmining-entities').derbyClone(false);
  var $tmButton = $('#textmining-button');

  $tmEntitiesUi.find('.scrollable-area')
    .empty()
    .append( $('#textmining-results').derbyClone('default', true) )
  ;

  $textminingUi.append( $('#textmining-input').derbyClone(false) );
  $textminingUi.append( $tmEntitiesUi );

  

  function updateButtonBubble(){
    var $bubble = $tmButton.find('.alert-bubble:first');
    var entityCount = doc.getTextminingEntitiesCount();

    if( entityCount !== 0 ){
      $tmButton.addClass('have-entities');
      $bubble.html( entityCount );
    } else {
      $tmButton.removeClass('have-entities');
      $bubble.html('');
    }
  }

  $tmButton.qtip({
    style: {
      classes: 'textmining-qtip'
    },

    events: {
      show: function(event, api){ // focus textarea on show
        var $qtip = api.elements.tooltip;
        var $textarea = $qtip.find('textarea:first');
        var $content = $qtip.find('.ui-tooltip-content:first');

        var textareaEmpty = $textarea.val() === '';
        if( textareaEmpty ){
          ui.focusWhenVisible( $textarea );
        }

        // update sat
        if( doc.haveTextminingEntities() ){
          $content.addClass('have-textmining-entities');
        } else {
          $content.removeClass('have-textmining-entities');
        }

        $content.removeClass('no-entities-found-after-submit');

        updateButtonBubble();
      }
    },

    show: {
      event: 'tap'
    },

    content: {
      text: $textminingUi
    }
  });

  $('body').on('tap', '.textmining-qtip .next', function(){
    var $button = $(this);
    var $content = $button.parents('.ui-tooltip-content');
    var $textarea = $content.find('textarea');
    var $scrollArea = $content.find('.scrollable-area:first');
    var text = $textarea.val();

    $content.addClass('loading');
    $textarea.attr('disabled', 'disabled');
    $button.attr('disabled', 'disabled');

    doc.setTextminingText(text, function(){
      $content.removeClass('loading');
      $textarea.removeAttr('disabled');
      $button.removeAttr('disabled');

      // b/c the ui may be used multiple times, reset to the top
      $scrollArea.scrollTop(0);

      var noTextminingEntities = !doc.haveTextminingEntities();
      if( noTextminingEntities ){
        $content
          .addClass('no-entities-found-after-submit')
          .removeClass('have-textmining-entities')
        ;
      } else {
        $content
          .removeClass('no-entities-found-after-submit')
          .addClass('have-textmining-entities')
        ;
      }

      updateButtonBubble();
    });
  });

  function prev( $someEle ){
    var $content = $someEle.parents('.ui-tooltip-content:first');

    //ui.focusWhenVisible( $content.find('textarea:first') );    
    doc.removeAllTextminingEntities();

    $content
      .removeClass('no-entities-found-after-submit')
      .removeClass('have-textmining-entities')
    ;

    updateButtonBubble();
  }

  $('body').on('tap', '.textmining-qtip .prev', function(){
    var $button = $(this);
    var $content = $button.parents('.ui-tooltip-content:first');
    var $textarea = $content.find('textarea');

    prev( $button );
  });

  $('body').on('tap', '.textmining-qtip .add', function(){
    var $qtip = $(this).parents('.qtip:first');
    var api = $qtip.qtip('qpi');
    var $textarea = $qtip.find('textarea:first');

    $textarea.val(''); // empty b/c we've now "used up" the text
    api.hide();
    doc.addCurrentTextminingEntities( cyutil.getNewEntityPosition );
    cyutil.relayout();
    updateButtonBubble();
  });

  $('body').on('tap', '.textmining-qtip .entity-instance .remove', function(){
    var $icon = $(this);
    var $entity = $icon.parents('.entity-instance:first');
    var entityId = $entity.attr('data-id');

    doc.removeTextminingEntity( entityId );
    updateButtonBubble();

    if( doc.getTextminingEntitiesCount() === 0 ){
      prev( $entity );
    }
  });

});