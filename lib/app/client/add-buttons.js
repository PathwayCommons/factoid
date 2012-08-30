// code for handling interactions with the info area (side bar)

$(function(){

  $('#add-entity-button').on('click', function(){
    cyutil.addEntityInGoodPosition();
  });

  $('#add-interaction-button').on('click', function(){
    cyutil.addInteractionInGoodPosition();
  });

  // prepare content for textmining area
  var $textminingUi = $('<div></div>');
  $textminingUi.append( $('#textmining-input').derbyClone(false) );
  $textminingUi.append( $('#textmining-entities').derbyClone('default', true) );

  var $tmButton = $('#textmining-button');

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
      event: 'click'
    },

    content: {
      text: $textminingUi
    }
  });

  $('body').on('click', '.textmining-qtip .next', function(){
    var $button = $(this);
    var $content = $button.parents('.ui-tooltip-content');
    var $textarea = $content.find('textarea');
    var text = $textarea.val();

    $content.addClass('loading');
    $textarea.attr('disabled', 'disabled');
    $button.attr('disabled', 'disabled');

    doc.setTextminingText(text, function(){
      $content.removeClass('loading');
      $textarea.removeAttr('disabled');
      $button.removeAttr('disabled');

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

  $('body').on('click', '.textmining-qtip .prev', function(){
    var $button = $(this);
    var $content = $button.parents('.ui-tooltip-content:first');
    var $textarea = $content.find('textarea');

    //ui.focusWhenVisible( $content.find('textarea:first') );    
    doc.removeAllTextminingEntities();

    $content
      .removeClass('no-entities-found-after-submit')
      .removeClass('have-textmining-entities')
    ;

    updateButtonBubble();
  });

  $('body').on('click', '.textmining-qtip .add', function(){
    var $qtip = $(this).parents('.qtip:first');
    var api = $qtip.qtip('qpi');

    api.hide();
    doc.addCurrentTextminingEntities( cyutil.getNewEntityPosition );
    updateButtonBubble();
  });

  $('body').on('click', '.textmining-qtip .entity-instance .remove', function(){
    var $icon = $(this);
    var $entity = $icon.parents('.entity-instance:first');
    var entityId = $entity.attr('data-id');

    doc.removeTextminingEntity( entityId );
    updateButtonBubble();
  });

});