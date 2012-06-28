var app = require('derby').createApp(module)
  , get = app.get
  , view = app.view
  , ready = app.ready
;

// ROUTES //

// Derby routes can be rendered on the client and the server
get('/', function(page, model, params) {
  
  var docId = 0; // just use a static document for now
  var docPath = "document." + docId;

  if( !model.get(docPath) ){ // create the empty, static doc
    model.set(docPath, {});
  }

  // Subscribes the model to any updates on this doc's object. Calls back
  // with a scoped model equivalent to:
  //   doc = model.at('document.' + docId)
  model.subscribe(docPath, function(err, doc) {
    model.ref("_doc", docPath);

    // Render will use the model data as well as an optional context object
    page.render({
      // TODO do we need anything in here?
    });
  })
});

// CONTROLLER FUNCTIONS //

ready(function(model) {

  // useful for debugging; disable in production

  window.model = model;

  // export controllers that the client side code will use
  // (putting them under the global `window` makes it s.t. we don't need to
  // require() them in the client side code -- nifty :)
  window.doc = ( require("./doc") )( model );

  // execute the client side code
  ( require("./client") )( model );
});
