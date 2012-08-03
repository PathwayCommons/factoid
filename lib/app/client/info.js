// code for handling interactions with the info area (side bar)

$(function(){

  $('#add-entity-button').on('click', function(){
    cyutil.addEntityInGoodPosition();
  });

  $('#add-interaction-button').on('click', function(){
    cyutil.addInteractionInGoodPosition();
  });

  $('#textmining-button').qtip({
    style: {
      classes: 'textmining-qtip'
    },

    events: {
      show: function(event, api){ // focus textarea on show
        var $qtip = api.elements.tooltip;
        var $textarea = $qtip.find('textarea:first');

        ui.focusWhenVisible( $textarea );

        if( doc.textminingTextIsEmpty() ){
          $textarea.val('');
        }   
      }
    },

    show: {
      event: 'click'
    },

    content: {
      text: function(){
        return $('#textmining').derbyClone();
      }
    }
  });

  $('body').on('click', '.textmining-qtip .next', function(){
    var $button = $(this);
    var $content = $button.parents('.ui-tooltip-content');
    var $textarea = $content.find('textarea');
    var text = $textarea.val();

    $content.addClass('loading');
    $textarea.attr('disabled', 'disabled');

    doc.setTextminingText(text, function(){
      $content.removeClass('loading');
      $textarea.removeAttr('disabled');
    });
  });

  $('body').on('click', '.textmining-qtip .prev', function(){
    var $button = $(this);
    var $content = $button.parents('.ui-tooltip-content:first');
    var $textarea = $content.find('textarea');

    ui.focusWhenVisible( $content.find('textarea:first') );    
    doc.removeAllTextminingEntities();
  });

  $('body').on('click', '.textmining-qtip .add', function(){
    var $qtip = $(this).parents('.qtip:first');
    var api = $qtip.qtip('qpi');

    api.hide();
    doc.addCurrentTextminingEntities( cyutil.getNewEntityPosition );
  });

  $('body').on('click', '.textmining-qtip .entity-instance .remove', function(){
    var $icon = $(this);
    var $entity = $icon.parents('.entity-instance:first');
    var entityId = $entity.attr('data-id');

    doc.removeTextminingEntity( entityId );
  });

});