// code for handling user interaction with the extendo ui

$(function(){

  var $graph = $('#graph');

  var $lastInfoQtip;

  $('#graph').extendo({
    startOpen: true,
    closeOnSelect: false,
    closeOnBgFocus: false,
    classes: "top left",
    expander: {
      content: '<span class="icon-chevron-down"></span>'
    },
    items: [
      {
        content: '<span class="icon-plus"></span>',
        attrs: {
          id: 'extendo-add',
          'data-tooltip': 'Add entity'
        },
        select: function(){
          cyutil.addEntityInGoodPosition();
          doc.showEditForLastAdded(function(){
            ui.focusWhenVisible( 'edit-name-input-' + doc.getLastAddedEntity().id );
          });
        }
      },

      {
        content: '<span class="icon-remove"></span>',
        disabled: true,
        attrs: {
          id: 'extendo-remove',
          'data-tooltip': 'Remove selected entities'
        },
        select: function(){
          cyutil.deleteSelectedEntitiesInDoc();          
        }
      },

      {
        content: '<span class="icon-resize-horizontal"></span>',
        attrs: {
          id: 'extendo-fit',
          'data-tooltip': 'Fit entities to screen'
        },
        select: function(){
          cy.fit(50);
        }
      },

      {
        content: '<span class="icon-refresh"></span>',
        attrs: {
          id: 'extendo-layout',
          'data-tooltip': 'Auto-rearrange entities'
        },
        select: function(){
          cyutil.relayout();
        }
      },

      {
        content: '<span class="icon-download-alt"></span>',
        attrs: {
          id: 'extendo-download',
          'data-tooltip': 'Download document as SIF'
        },
        select: function(){
          doc.exportAsSif();
        }
      },

      {
        content: '<span class="icon-info-sign"></span>',
        attrs: {
          id: 'extendo-info',
          'data-tooltip': 'About Factoid'
        },
        select: function(){
          
          if( $lastInfoQtip && $lastInfoQtip.is(':visible') ){
            $('#extendo-info').trigger('hideqtip');

          } else {
            $('#extendo-info').showqtip({
              content: {
                title: $('#description-title').text(),
                text: $('#description-content').clone()
              },

              style: { classes: 'info-qtip' }
            });

            $lastInfoQtip = $('.qtip:visible:last');
          }
        }
      },

      {
        href: 'https://github.com/PathwayCommons/factoid',
        content: '<span class="factoid-logo">F</span>',
        attrs: {
          id: 'extendo-linkout',
          'data-tooltip': 'Open project on GitHub'
        }
      }
    ]
  });

  // update the state of the delete button based on what's selected in the graph
  var $remove = $('#extendo-remove');
  var setRemoveEnabledState = _.debounce(function(){ // debounce so we don't overdo things with quickly changing selections
    var anyNodesSelected = cy.$('node:selected').size() !== 0;

    if( anyNodesSelected ){
      $remove.extendo('enable');
    } else {
      $remove.extendo('disable');
    }
  }, 100);

  $graph.cytoscape(function(){
    cy

      // call the update function whenever the selection state changes
      .on('select unselect remove', 'node', function(){ // on selection change
        setRemoveEnabledState();
      })

      // update the layout extendo item whenever No. of nodes changes
      .on('add remove', 'node', function(){ // on add/remove nodes
        var anyNodes = cy.nodes().length !== 0;

        if( anyNodes ){
          $layout.extendo('enable');
        } else {
          $layout.extendo('disable');
        }
      })
      
    ;

  });


  // update the state of the layout button
  var $layout = $('#extendo-layout');
  var $layoutOverlay = $('#graph-layout-overlay');
  $graph.cytoscape(function(){
    cy
      .on('layoutstart', function(){
        $layout.extendo('disable');
        $layoutOverlay.removeClass('hidden').addClass('shown');
      })

      .on('layoutstop', function(){
        $layout.extendo('enable');
        $layoutOverlay.removeClass('shown').addClass('hidden');
      })
    ;
  });

});