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
    model.fn('_entityWithId', '_entities', function(entities){
      var id2ent = {};

      if( entities ){
        for( var i = 0; i < entities.length; i++ ){
          var entity = entities[i];
          id2ent[ entity.id ] = entity;
        }
      }

      return id2ent;
    });

    // provide an easy way to get entities 
    model.fn('_participantsFor', '_entities', function(entities){ // TODO this seems inefficient
      var pfor = {};

      if( entities ){
        var id2ent = {};

        // set up id2ent map
        for( var i = 0; i < entities.length; i++ ){
          var entity = entities[i];
          id2ent[ entity.id ] = entity;
        }

        // get the participants
        for( var i = 0; i < entities.length; i++ ){ 
          var entity = entities[i];

          if( entity.interaction && entity.participantIds ){
            var pids = entity.participantIds;
            var parts = pfor[ entity.id ] = [];

            for( var j = 0; j < pids.length; j++ ){
              var pid = pids[j];
              var part = id2ent[ pid ];

              parts.push( part );
            }
          }
        }
      }

      return pfor;
    });

    // model.fn('_participantsFor', '_entities', function( entities ){
    //   var pfor = {};

    //   console.log('for', entities);

    //   if( entities ){
    //     for( var i = 0; i < entities.length; i++ ){ // check each entity
    //       var entity = entities[i];
    //       var id = entity.id;
    //       var pids = entity.participantIds;
    //       pfor[ id ] = [];

    //       if( pids ){ // if the entity has pids, then build a list
    //         for( var j = 0; j < pids.length; j++ ){ // for each pid, put the corresponding entity in the list
    //           var pid = pids[j];
    //           var pidEntityIndex = model.at('_entityIdToIndex').at( pid ).get();
    //           var pidEntity = model.at('_entities').at( pidEntityIndex ).get();

    //           pfor[ id ].push( pidEntity );
    //         } // for pids
    //       } // if pids

    //     } // for entities
    //   } // if entities

    //   return pfor;
    // });
    
    return page.render();
  })
});

// CONTROLLER FUNCTIONS //

ready(function(model) {

  model.setNull(docPath, { // create the empty, static doc
    entities: []
  });

  // useful for debugging; disable in production
  window.model = model;
  window.view = app.view;

  // export controllers that the client side code will use
  // (putting them under the global `window` makes it s.t. we don't need to
  // require() them in the client side code -- nifty :)
  window.doc = ( require("./doc") )( model );

  // execute the client side code
  ( require("./client") )( model );
});
