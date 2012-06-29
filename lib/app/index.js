var app = require('derby').createApp(module)
  , get = app.get
  , view = app.view
  , ready = app.ready
;

var docId = 0; // just use a static document for now
var docPath = "document." + docId;  

// ROUTES //

// Derby routes can be rendered on the client and the server
get('/', function(page, model, params) {

  // Subscribes the model to any updates on this doc's object. Calls back
  // with a scoped model equivalent to:
  //   doc = model.at('document.' + docId)
  return model.subscribe(docPath, function(err, doc) {
    model.ref('_doc', doc);
    model.ref('_entities', '_doc.entities');
    model.ref('_entityIdToIndex', '_doc.entityIdToIndex');
    
    return page.render();
  })
});

// CONTROLLER FUNCTIONS //

ready(function(model) {

  if( !model.get(docPath) ){ // create the empty, static doc
    model.set(docPath, {
      entities: [],
      entityIdToIndex: {}
    });
  }

  // useful for debugging; disable in production

  window.model = model;

  // export controllers that the client side code will use
  // (putting them under the global `window` makes it s.t. we don't need to
  // require() them in the client side code -- nifty :)
  window.doc = ( require("./doc") )( model );

  // execute the client side code
  ( require("./client") )( model );
});
