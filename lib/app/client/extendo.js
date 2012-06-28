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
        content: '<span class="icon-plus"></span>'
      },

      {
        content: '<span class="icon-remove"></span>'
      },

      {
        content: '<span class="icon-refresh"></span>'
      },

      {
        content: '<span class="icon-move"></span>'
      },

      {
        content: '<span class="icon-download-alt"></span>'
      }
    ]
  });

});