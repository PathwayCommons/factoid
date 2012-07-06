$(function(){

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
          setTimeout(function(){ // otherwise, the button gets stuck in the selected state
            cyutil.deleteSelectedEntitiesInDoc();
          }, 255);
          
        }
      },

      {
        content: '<span class="icon-refresh"></span>',

        select: function(){

          $(this).showqtip({
            content: {
              text: $('#foo')
            }
          });
        }
      },

      // {
      //   content: '<span class="icon-move"></span>'
      // },

      // {
      //   content: '<span class="icon-download-alt"></span>',
      //   disabled: true
      // }

      {
        content: '<span class="icon-info-sign"></span>',
        attrs: {
          id: 'extendo-info'
        }
      },

      {
        content: '<a href="https://github.com/PathwayCommons/factoid"><span class="icon-github"></span></a>'
      }
    ]
  });

  // update the state of the delete button based on what's selected in the graph
  var setRemoveEnabledState = _.debounce(function(){ // debounce so we don't overdo things with quickly changing selections
    var anyNodesSelected = cy.$('node:selected').size() !== 0;

    if( anyNodesSelected ){
      $('#extendo-remove').extendo('enable');
    } else {
      $('#extendo-remove').extendo('disable');
    }
  }, 100);

  // call the update function whenever the selection state changes
  $('#graph').cytoscape(function(){
    cy.on('select unselect remove', 'node', function(){ // on selection change
      setRemoveEnabledState();
    })
  });

  $('#extendo-info').qtip({
    content: {
      title: $('#description-title').text(),
      text: $('#description-content')
    }
  });

});