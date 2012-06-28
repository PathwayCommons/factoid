var app = require('derby').createApp(module)
  , get = app.get
  , view = app.view
  , ready = app.ready
;

// ROUTES //

// Derby routes can be rendered on the client and the server
get('/', function(page, model, params) {
  
  var docId = 0; // just use a static document for now

  // Subscribes the model to any updates on this doc's object. Calls back
  // with a scoped model equivalent to:
  //   doc = model.at('document.' + docId)
  model.subscribe('document.' + docId, function(err, doc) {
    // Render will use the model data as well as an optional context object
    page.render({
      // TODO do we need anything in the context?
    });
  })
});


// CONTROLLER FUNCTIONS //

ready(function(model) {
  exports.foo = function(){
    console.log("foo");
  }
})
