var app = require('derby').createApp(module)
  , get = app.get
  , view = app.view
  , ready = app.ready
  , uuid = require('node-uuid')
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

app.on('model', function( model ){
  model.fn('organismSort', function(org1, org2){
    var str1 = org1.sciName;
    var str2 = org2.sciName;

    return ( ( str1 == str2 ) ? 0 : ( ( str1 > str2 ) ? 1 : -1 ) );
  });

  model.fn('entitySort', function(ent1, ent2){
    if( ent2.association && !ent1.association ){
      return -1;
    } else if( !ent2.association && ent1.association ){
      return 1;
    }

    return ent2.creationTimestamp - ent1.creationTimestamp; // just sort in newly-added-first order
  });
});

// ROUTES //
// Derby routes can be rendered on the client and the server

get('/', function(page, model, params){
  function getId(){
    return uuid.v4();
  }

  function idIsReserved(){
    var ret = model.get('documents.' + docId) != undefined;
    return ret;
  }

  var docId = getId();

  while( idIsReserved() ){
    docId = getId();
  }

  return page.redirect('/doc/' + docId);
});

get('/doc/:docId', function(page, model, params) {
  var doc = require('../doc')( model ); // N.B. required only for doc.subscribe()
  var useQunit = params.query.qunit !== undefined; // e.g. /?qunit=true or /?qunit
  var docId = '' + params.docId; // specified doc

  if( useQunit ){ // use qunit testing doc if we're testing so we don't disrupt real docs
    docId = 'qunit';
  }

  var docPath = 'documents.' + docId;

  return doc.subscribe(docId, function(){ // handles common model subscriptions for us

    // if we've got the qunit flag, then we should return the qunit testing page for
    // this url controller (testing this way ensures that the context is the same as
    // it would be on the real document page)
    if( useQunit ){
      model.set('_page.useQunit', true);
      return page.render('qunit', {
        scripts: [ 'doc' ] // the scripts in /public/qunit we want to include on the page
      });
    } else {
      model.set('_page.useQunit', false);
      return page.render();
    } 
  });

});

// CONTROLLER FUNCTIONS //

// only executed on the client side
ready(function(model) {

  // useful for debugging; disable in production
  // TODO detect whether we're in production mode (i.e. NODE_ENV=production), and
  // if so, disable it
  window.model = model;
  
  // export controllers that the client side code will use
  // (putting them under the global `window` makes it s.t. we don't need to
  // require() them in the client side code
  window.doc = ( require("../doc") )( model ); // doc controller

  // execute the client side code
  var useQunit = model.get('_page.useQunit');
  if( !useQunit ){
    ( require("./client") )( model );
  }
});
