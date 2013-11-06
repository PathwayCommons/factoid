var app = require('derby').createApp(module)
  , get = app.get
  , view = app.view
  , ready = app.ready
;

view.fn('nonempty', function(val){
  if( val === null || val === undefined ){
    return false;
  }

  // see if it's an empty array
  if( val instanceof Array ){
    if( val.length === 0 ){
      return false;
    } else {
      return true;
    }
  }

  // see if it's an empty object
  if( typeof val === 'object' ){
    for( var i in val ){
      return true;
    }
    return false;
  }

  // see if it's a string
  if( typeof val === typeof '' ){
    if( val.length === 0 ){
      return false;
    } else {
      return true;
    }
  }

  return true; // then it must be nonempty
});

view.fn('bool', function(val){
  if( val ){
    return true;
  } else {
    return false;
  }
});

// ROUTES //

var lastDocId = 0;

get('/', function(page, model, params){
  function getId(){
    return '' + lastDocId++;
  }

  function idIsReserved(){
    var ret = model.get('documents.' + docId + '.reservedId');
    return ret;
  }

  var docId = getId();

  while( idIsReserved() ){
    docId = getId();
  }

  return page.redirect('/' + docId);
});

// Derby routes can be rendered on the client and the server
get('/:docId', function(page, model, params) {
  var useQunit = params.query.qunit !== undefined; // e.g. /?qunit=true or /?qunit
  var docId = '' + params.docId; // specified doc

  if( useQunit ){ // use qunit testing doc if we're testing so we don't disrupt real docs
    docId = 'qunit';
  }

  model.set('_docId', docId);

  var docPath = "documents." + docId;
  model.set('_docPath', docPath);

  var organisms;
  model.set('organisms', organisms = [
    {
      id: 9606,
      name: 'human',
      sciName: 'Homo sapiens',
    },

    {
      id: 10090,
      name: 'mouse',
      sciName: 'Mus musculus'
    }
  ]);

  var orgs = organisms;
  for( var i = 0; i < orgs.length; i++ ){
    var org = orgs[i];
    var id = org.id;

    model.setNull('organisms.' + i + '._enabled', true);
  }

  // Subscribes the model to any updates on this doc's object. Calls back
  // with a scoped model equivalent to:
  //   doc = model.at('document.' + docId)
  return model.subscribe(docPath, 'entities', function(err, doc, entities){
    model.ref('_doc', doc);

    model.set('_doc.reservedId', true);

    model.setNull('_doc.stage', 'textmining');

    // _entities is built from the array of ids in _doc.entities and the entity namespace
    model.refList('_entities', entities, '_doc.entityIds');



    // if we've got the qunit flag, then we should return the qunit testing page for
    // this url controller (testing this way ensures that the context is the same as
    // it would be on the real document page)
    if( useQunit ){
      model.set('_useQunit', true);
      return page.render('qunit', {
        scripts: [ 'doc' ] // the scripts in /public/qunit we want to include on the page
      });
    } else {
      model.set('_useQunit', false);
      return page.render();
    } 

  });
});

// CONTROLLER FUNCTIONS //

ready(function(model) {

  // TOOO determine why this creation call fails if not called in .ready()
  var docPath = model.get('_docPath');
  model.setNull(docPath, { // create the empty, static doc for demoing purposes
    entityIds: []
  });
  model.setNull('entities', {}); // create the entity namespace // TODO prob not nec.

  // useful for debugging; disable in production
  // TODO detect whether we're in production mode (i.e. NODE_ENV=production), and
  // if so, disable it
  window.model = model;
  
  // export controllers that the client side code will use
  // (putting them under the global `window` makes it s.t. we don't need to
  // require() them in the client side code -- nifty :)
  window.doc = ( require("./doc") )( model );

  // execute the client side code
  var useQunit = model.get('_useQunit');
  if( !useQunit ){
    ( require("./client") )( model );
  }
});
