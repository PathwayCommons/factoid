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

  var docPath = "document." + docId;

  model.set('_docPath', docPath);

  // Subscribes the model to any updates on this doc's object. Calls back
  // with a scoped model equivalent to:
  //   doc = model.at('document.' + docId)
  return model.subscribe(docPath, function(err, doc){
    model.ref('_doc', doc);
    model.ref('_entities', '_doc.entities');

    // NB these model.fn callbacks are like db views
    // they let us access the model in much more convenient ways without compromising the
    // model json structure

    // provide an easy way to get the index of entities
    model.fn('_entityIdToIndex', '_entities', function(entities){
      var id2index = {};

      if( entities ){
        for( var i = 0; i < entities.length; i++ ){
          var entity = entities[i];
          id2index[ entity.id ] = i;
        }
      }

      return id2index;
    });

    // provide an easy way to get entities by id
    model.fn('_entity', '_entities', function(entities){
      var id2ent = {};

      if( entities ){
        for( var i = 0; i < entities.length; i++ ){
          var entity = entities[i];
          id2ent[ entity.id ] = entity;
        }
      }

      return id2ent;
    });

    // provide an easy way to get entities with references to other entities flattened
    model.fn('_populatedEntities', '_entities', function(entities){
      var popd = [];

      if( entities ){
        var id2ent = {};
        var allEnts = [];

        // set up id2ent map and all entities list (allEnts)
        for( var i = 0; i < entities.length; i++ ){
          var entity = entities[i];
          id2ent[ entity.id ] = entity;
          allEnts.push( entity );
        }

        // get the participants
        for( var i = 0; i < entities.length; i++ ){ 
          var entity = {}; // don't change the original obj by making a copy
          for( var j in entities[i] ){
            entity[j] = entities[i][j];
          }

          popd.push(entity); // put the entity in the returned list

          // check if the entity is associated with some entity in a db,
          // and if so, set a flag
          entity.associated = false;
          if( entity.uniprot ){
            entity.associated = true;
          }

          if( entity.interaction && entity.participantIds ){ // then we need to flatten entity refs
            var interaction = entity; // it is an interaction, after all, so let's call it one
            var pids = interaction.participantIds;
            var parts = interaction.participants = [];
            var hasEntity = interaction.hasEntity = {};
            var potParts = interaction.potentialParticipants = [];

            // build the list of current participants
            for( var j = 0; j < pids.length; j++ ){
              var pid = pids[j];
              var part = id2ent[ pid ];

              hasEntity[ pid ] = true;
              parts.push( part );
            }

            // build the list of potential participants
            for( var j = 0; j < allEnts.length; j++ ){
              var potPart = allEnts[j];
              var isSelf = potPart.id === interaction.id;
              var isPartAlready = hasEntity[ potPart.id ];

              if( !isSelf && !isPartAlready ){
                potParts.push( potPart );
              }
            }
          }
        }
      }

      return popd;
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
