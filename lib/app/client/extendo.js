// code for handling user interaction with the extendo ui

$(function(){

  var $graph = $('#graph');

  $('body').extendo({
    startOpen: true,
    closeOnSelect: false,
    closeOnBgFocus: false,
    classes: "top left",
    expander: {
      content: '<span class="icon-caret-down"></span>'
    },
    items: [
      {
        content: '<span class="icon-plus"></span>',
        select: function(){
          doc.addEntity({
            viewport: cyutil.getNewEntityPosition()
          });
        }
      },

      {
        content: '<span class="icon-remove"></span>',
        disabled: true,
        attrs: {
          id: 'extendo-remove'
        },
        select: function(){
          cyutil.deleteSelectedEntitiesInDoc();          
        }
      },

      {
        content: '<span class="icon-refresh"></span>',
        attrs: {
          id: 'extendo-layout'
        },
        select: function(){
          cy
            .one('layoutstop', function(){
              cy.nodes().trigger('updateposition'); // indicate the nodes should update entity position after the layout is done
            })

            .layout({
              name: 'arbor'
            })
          ;
        }
      },

      {
        content: '<span class="icon-info-sign"></span>',
        attrs: {
          id: 'extendo-info'
        },
        select: function(){
          $('#extendo-info').showqtip({
            content: {
              title: $('#description-title').text(),
              text: $('#description-content')
            }
          });
        }
      },

      {
        content: '<a target="_blank" href="https://github.com/PathwayCommons/factoid"><span class="icon-github"></span></a>'
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

  // call the update function whenever the selection state changes
  $graph.cytoscape(function(){
    cy.on('select unselect remove', 'node', function(){ // on selection change
      setRemoveEnabledState();
    })
  });


  // update the state of the layout button
  var $layout = $('#extendo-layout');
  $graph.cytoscape(function(){
    cy
      .on('layoutstart', function(){
        $layout.extendo('disable');
      })

      .on('layoutstop', function(){
        $layout.extendo('enable');
      })
    ;
  });
});