var app = require('derby').createApp(module)
  , get = app.get
  , view = app.view
  , ready = app.ready
;

// ROUTES //

// Derby routes can be rendered on the client and the server
get('/', function(page, model, params) {
  var useQunit = params.query.qunit !== undefined; // e.g. /?qunit=true or /?qunit
  var docId = '0'; // just use a static document for now (id 'demo')

  if( useQunit ){ // use qunit testing doc if we're testing so we don't disrupt real docs
    docId = 'qunit';
  }

  var docPath = "documents." + docId;

  model.set('_docPath', docPath);

  // Subscribes the model to any updates on this doc's object. Calls back
  // with a scoped model equivalent to:
  //   doc = model.at('document.' + docId)
  return model.subscribe(docPath, 'entities', function(err, doc, entities){
    model.ref('_doc', doc);

    // _entities is built from the array of ids in _doc.entities and the entity namespace
    model.refList('_entities', entities, '_doc.entities');

    // keep a list of participants mapped by id of the interaction for renderering
    model.fn('_participants', '_entities', function(_entities){
      var _participants = {}; // entity id => array of participant entity objects
      var id2ent = {};      

      if( _entities ){
        for( var i = 0, ent; i < _entities.length && (ent = _entities[i]) && ent; i++ ){
          id2ent[ ent.id ] = ent;
        }

        for( var i = 0, ent; i < _entities.length && (ent = _entities[i]) && ent; i++ ){
          var pids = ent.participantIds;

          if( pids ){ // then make an entry and put all the entities in it
            var entry = _participants[ ent.id ] = [];

            for( var j = 0; j < pids.length; j++ ){ // put all entities corresponding to the pids into the entry
              var pid = pids[j];
              entry.push( id2ent[pid] );
            }
          }
        }
      }

      return _participants;
    });

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
    entities: []
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
