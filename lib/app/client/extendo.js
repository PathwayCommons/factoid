$(function(){

  $('body').extendo({
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
      }

      // {
      //   content: '<span class="icon-refresh"></span>'
      // },

      // {
      //   content: '<span class="icon-move"></span>'
      // },

      // {
      //   content: '<span class="icon-download-alt"></span>',
      //   disabled: true
      // }
    ]
  });

  var setRemoveEnabledState = _.debounce(function(){
    var anyNodesSelected = cy.$('node:selected').size() !== 0;

    if( anyNodesSelected ){
      $('#extendo-remove').extendo('enable');
    } else {
      $('#extendo-remove').extendo('disable');
    }
  }, 100);

  $('#graph').cytoscape(function(){
    cy.on('select unselect remove', 'node', function(){ // on selection change
      setRemoveEnabledState();
    })
  });

});