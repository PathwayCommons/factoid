// the document controller (used to modify a currently-loaded document)

module.exports = function( model, srvs ){

  var doc; // internal ref

  // if services are specified manually (i.e. serverside) then use those
  // otherwise (i.e. clientside) it's defined for us as window.services
  if( srvs ){
    services = srvs;
  }

  // a proxy so we don't necessarily need to use derby ids
  function modelId(){
    return model.id();
  }

  function isFunction( obj ){
    return typeof obj === "function";
  }

  function isObject( obj ){
    return typeof obj === 'object';
  }

  var lastAssociationQueryTime = 0;

  function replaceTempIds( ents ){
    var temp2id = {};
    var retEnts = [];

    function getIdFromTemp( temp ){
      var idAlreadyMapped = temp2id[ temp ] != null;
      var id;
      
      if( !idAlreadyMapped ){
        id = temp2id[ temp ] = modelId(); //model.id();
      } else {
        id = temp2id[ temp ];
      }

      return id;
    }

    if( ents ){ for( var i = 0; i < ents.length; i++ ){
      var ent = ents[i];
      var temp = ent.id;
      var id = getIdFromTemp( temp );

      // now, replace the id and put the entity in the return list
      ent.id = id;
      retEnts.push( ent );

      // replace participant ids
      if( ent.participantIds ){
        var pids = ent.participantIds;
        
        for( var j = 0; j < pids.length; j++ ){
          var partTemp = pids[j];
          var partId = getIdFromTemp( partTemp );

          ent.participantIds[j] = partId;
        }
      }
    } } // if & for

    return retEnts;
  };

  return doc = {

    // subscribe to the document model and do any necessary model/doc setup (called serverside)
    // docId: the path of the doc in the model (e.g. `document.some-id`)
    // next: the returning callback in model.subscribe() (i.e. where you call page.render() etc)
    subscribe: function (docId, next){
      var docPath = 'documents.' + docId;
      var doc = this;

      return model.subscribe(docPath, 'organisms', function(err){
        model.setNull(docPath, { // create the empty new doc if it doesn't already exist
          id: docId
        });

        // from the global organisms collection, create a list we can use in the ui
        var orgSort = model.sort('organisms', 'organismSort');
        orgSort.ref('_page.organisms');

        // create a reference to the document
        model.ref('_page.doc', 'documents.' + docId);

        // from the list of organisms, set each to enabled by default
        var orgs = model.get('_page.organisms');
        for( var i = 0; i < orgs.length; i++ ){
          var org = orgs[i];
          var id = org.ncbiId;

          model.setNull('_page.doc.organismEnabled.ncbi' + id, true);
        }

        // the default stage of a doc is textmining
        model.setNull('_page.doc.stage', 'textmining');

        // create a list of entities in the document that we can use in the ui
        var entSort = model.sort('documents.' + docId + '.entities', 'entitySort');
        entSort.ref('_page.entities');

        return next();

      });
    },

    // listeners needed to keep the model in check for display purposes
    // NB should be called client side only at init
    addInitListeners: function(){
      var doc = this;

      // keep track of whether an entity's name has been changed
      model.on('change', '_page.doc.entities.*.name', function(id, name, oldName){
        var mEnt = model.at('_page.doc.entities').at(id);
        mEnt.set('changedName', true);
      });

      // update the participants list when the the entity list changes and when connections change
      this.addEntity(function(){
        doc.recalculatePotentialParticipants();
      });
      this.removeEntity(function(){
        doc.recalculatePotentialParticipants();
      });
      this.connectEntityToInteraction(function(){
        doc.recalculatePotentialParticipants();
      });
      this.disconnectEntityFromInteraction(function(){
        doc.recalculatePotentialParticipants();
      });

    },

    indicateUiLoaded: function(){
      model.set('_page.loadedUi', true);
    },


    // ENTITY ADD & REMOVE
    ////////////////////////////////////////////////////////////////////////////////

    // makes sure that we create an interaction with all the necessary
    // fields
    makeInteraction: function ( interaction ){
      interaction = interaction || {}; // ensure we have an object

      if( interaction.type !== "interaction" ){ // enforce interaction type
        interaction.type = "interaction";
      }

      if( !interaction.name ){
        interaction.name = interaction.type;
      }

      if( !interaction.participantIds ){
        interaction.participantIds = [];
      }

      interaction.interaction = true;

      return interaction;
    },

    // makes sure that we create an entity with all the necessary
    // fields
    makeEntity: function ( entity ){
      if( !entity ){ // in case nothing specified
        entity = {};
      }

      if( !entity.type ){ // in case type is elided
        entity.type = "entity";
      }

      if( !entity.name ){ // in case name is elided, use some default value
        entity.name = "new entity";
      } else {
        entity.changedName = true;
      }

      entity.entity = true;

      if( !entity.viewport ){
        entity.viewport = {
          x: 0,
          y: 0
        };
      }

      if( entity.id === undefined ){ // then generate an id for the entity
        entity.id = modelId() //model.id();
      }

      entity.creationTimestamp = +new Date();

      var entityWithSameIdAlreadyExists = this.entity(entity.id) !== undefined;
      if( entityWithSameIdAlreadyExists ){
        return; // there can only be one
      }

      return entity;
    },

    makeEntities: function ( ents ){
      if( ents ){ for( var i = 0; i < ents.length; i++ ){

        if( ents[i].type === 'interaction' ){
          ents[i] = this.makeInteraction( ents[i] );
        } else {
          ents[i] = this.makeEntity( ents[i] );
        }

      } } // if & for

      return ents;
    },

    getLastAddedEntity: function(){
      return model.get('_page.entities.0');
    },

    // .addInteraction({ [type], [name] })
    // adds an interaction to the doc
    // NB: you should listen via addEntity (not addInteraction)
    // otherwise, you'd have to negotiate and merge multiple events (pretty hard)
    addInteraction: function( interaction ){
      interaction = this.makeInteraction( interaction );

      return this.addEntity(interaction);
    },

    // .addEntity({ [type], [name], [viewport] })
    // add an entity to the document
    // 
    // .addEntity( function( entity ){} )
    // listen for when entities are added
    addEntity: function( entity ){
      var fn = arguments[0];
      if( isFunction( fn ) ){ // then bind to when an entity is added to the doc
        model.on('change', '_page.doc.entities.*', function(id, val, prev){ 
          var valWasAdded = val !== undefined;
          if( valWasAdded ){
            var entity = val;
            fn( val );
          }
        });
        return;

      } else { // then add the entity to the doc
        entity = this.makeEntity( entity );
        model.set( '_page.doc.entities.' + entity.id, entity );
        model.set('_page.justAdded.' + entity.id, true);
        setTimeout(function(){
          model.set('_page.justAdded.' + entity.id, false);
        }, 500); // NB sync w/ ani speed
      }

      return entity;
    },

    // .removeEntity( entityId )
    // removes the entity from the document
    //
    // .removeEntity( function( entityId ){} )
    // listens for when entities are removed
    removeEntity: function( entityId ){ 
      var fn = arguments[0];
      if( isFunction( fn ) ){ // then bind to when an entity is removed from the doc
        model.on('change', '_page.doc.entities.*', function(id, val, prev){
          var valWasRemoved = val === undefined && prev !== undefined;
          if( valWasRemoved ){
            fn( id );
          }
        });
        return;

      } else { // then remove the entity from the doc

        // remove the entity
        model.del('_page.doc.entities.' + entityId);

        
        var ints = model.get('_page.entities');
        var affectedIntnIds = [];

        // remove references to the removed entity in all interactions (& hanging intns)
        for( var i = 0; i < ints.length; i++ ){
          var intn = ints[i];

          if( !intn.interaction ){ continue; }

          var intnId = intn.id;
          var pids = ints[i].participantIds;
          var indicesToRemove = [];

          // get indices of pids to remove
          for( var j = 0; j < pids.length; j++ ){
            var pid = pids[j];

            if( pid === entityId ){
              indicesToRemove.push( j );
            }
          }

          // keep track of interactions who have had their pids plucked
          if( indicesToRemove.length > 0 ){
            affectedIntnIds.push( intn.id );
          }

          // now remove the indices in reverse order (so we don't alter indices as we go)
          for( var j = indicesToRemove.length - 1; j >= 0 ; j-- ){
            var index = indicesToRemove[j];

            model.remove('_page.doc.entities.' + intnId + '.participantIds', index, 1);
          }
          
        } // for iteractions

        for( var i = 0; i < affectedIntnIds.length; i++ ){
          var intnId = affectedIntnIds[i];
          var pids = model.get('_page.doc.entities.' + intnId + '.participantIds');
          var hangingIntn = pids.length === 0;

          if( hangingIntn ){
            this.removeEntity( intnId );
          }
        }
      }
    },

    // TODO a more efficient version for removing multiple entities at once
    removeEntities: function( entityIds ){

    },

    // removes all entities from the doc
    // NB: use .removeEntity() for listening to when entities are removed
    removeAllEntities: function(){
      var ents = model.get('_page.entities');
      var ids = [];

      // build a list of entity ids to remove
      // NB: can't iterate over collection and delete at same time, else iteration can get in a bad state
      for( var i = 0; i < ents.length; i++ ){
        var id = ents[i].id;
        ids.push( id );
      }

      for( var i = 0; i < ids.length; i++ ){
        this.removeEntity( ids[i] );
      }
    },

    // .entity( entId ) : gets the entity with the given id
    // 
    // NB: you shouldn't really need to call this, especially considering that the
    // entity object you get here isn't populated with all the convenient stuff
    // you'd need to build UI, anyway
    entity: function( entityId ){
      return model.get('_page.doc.entities.' + entityId);
    },

    // checks whether an entity with the specified ID exists in the document
    entityExists: function( entityId ){
      return this.entity( entityId ) !== undefined;
    },

    // gets all the entities in the document (useful for populating cytoscape.js graph on page load)
    entities: function(){
      return model.get('_page.entities');
    },

    interactions: function(){
      var ents = doc.entities();
      var ints = [];

      for( var i = 0; i < ents.length; i++ ){
        var ent = ents[i];

        if( ent.interaction ){
          ints.push( ent );
        }
      }

      return ints;
    },

    empty: function(){
      var ents =  model.get('_page.entities');

      return ents != null && ents.length > 0;
    },

    entityIsInteraction: function( entityId ){
      return model.get('_page.doc.entities.' + entityId + '.interaction') ? true : false;
    },



    // ENTITY-INTERACTION CONNECTION
    ////////////////////////////////////////////////////////////////////////////////

    // gets whether an interaction has a participant
    interactionHasParticipant: function( interactionId, participantId ){

      var partsIds = model.get('_page.doc.entities.' + interactionId + '.participantIds');
      for( var i = 0; i < partsIds.length; i++ ){
        var id = partsIds[i];

        if( id === participantId ){
          return true;
        }
      }

      return false;
    },

    // .connectEntityToInteraction(entId, intId) : connects entity to interaction
    // fails when
    //  - entity and interaction are the same
    //  - entity or interaction aren't in the document
    //  - entity is already connected to interaction
    //  - the interaction specified isn't actually one
    //
    // .connectEntityToInteraction( function(entId, intId){} ) : listens for when
    // an entity is connected to an interaction
    connectEntityToInteraction: function( entityId, interactionId ){
      var intIndex, entIndex, interaction, entity;
      var fn = arguments[0]; 

      if( isFunction(fn) ){ // then listen to when entities are connected to interactions
        model.on('insert', '_page.doc.entities.*.participantIds', function( interactionId, index, values ){
          var entityIds = values;
          for( var i = 0; i < entityIds.length; i++ ){
            var entityId = entityIds[i];
            fn(entityId, interactionId);
          }
        });
        return;
      }

      if( interactionId === entityId ){
        return; // you can't connect an interaction to itself
      }

      var entityExists = this.entityExists( entityId );
      var interactionExists = this.entityExists( interactionId );

      var inDoc = entityExists && interactionExists;
      if( !inDoc ){
        return; // you can't connect them together if they don't exist in the doc
      }
      var interaction = this.entity( interactionId );
      var interactionIsRightType = this.entityIsInteraction( interactionId );
      if( !interactionIsRightType ){ return; } // can't connect if not right type

      // check if the entity is already connected
      var entityAlreadyConnected = this.interactionHasParticipant( interactionId, entityId );
      if( entityAlreadyConnected ){ return; } // can't connect if already connected

      model.push('_page.doc.entities.' + interactionId + '.participantIds', entityId);
    },

    // .disconnectEntityFromInteraction( entId, intId ) : disconnected an entity from an
    // interaction; can fail if they're not connected to begin with
    //
    // .disconnectEntityFromInteraction( function(entId, intId){} ) : listens for when an
    // entity is disconnected from an interaction
    disconnectEntityFromInteraction: function( entityId, interactionId ){
      var fn = arguments[0];

      if( isFunction(fn) ){ // then listen to when entities are disconnected to interactions
        model.on('remove', '_page.doc.entities.*.participantIds', function(interactionId, index, removed){
          var entityIds = removed;
          for( var i = 0; i < entityIds.length; i++ ){
            var entityId = entityIds[i];

            fn(entityId, interactionId);
          }
        });
        return;
      }

      var entity = this.entity(entityId);
      var interaction = this.entity(interactionId);

      var inDoc = entity && interaction;
      var interactionIsRightType = this.entityIsInteraction( interactionId );
      if( !inDoc || !interactionIsRightType ){
        return; // you can't connect them together if they don't exist in the doc
      }

      // check if the entity is already connected
      var entityAlreadyConnected = false;
      var pids = interaction.participantIds;
      var entIndex;
      for( var i = 0; i < pids.length; i++ ){
        var pid = pids[i];

        if( pid === entityId ){
          entityAlreadyConnected = true;
          entIndex = i;
          break;
        }
      }

      if( entityAlreadyConnected ){ // then remove from list
        model.remove('_page.doc.entities.' + interactionId + '.participantIds', entIndex, 1);
      }
    },

    recalculatePotentialParticipants: function( interactionId ){
      if( interactionId ){
        model.ref('_page.potentialPartcipantsInteraction', '_page.doc.entities.' + interactionId);

        // so we only render for the selected interaction
        model.del('_page.isPotentialPartcipantsInteraction');
        model.set('_page.isPotentialPartcipantsInteraction.' + interactionId, true);
      }

      var intn = model.get('_page.potentialPartcipantsInteraction');

      if( !intn ){ return; } // if no interaction set, then we don't need to recalc the list

      var docId = model.get('_page.doc.id');
      var ents = model.sort('documents.' + docId + '.entities', 'entitySort').get(); // b/c the _page.entities ref may not be uptodate yet
      var pids = intn.participantIds;
      var hasPid = {};
      var potPartPids = [];

      for( var i = 0; i < pids.length; i++ ){
        var pid = pids[i];
        hasPid[ pid ] = true;
      }

      for( var i = 0; i < ents.length; i++ ){
        var ent = ents[i];
        if( !ent ){ continue; } // b/c this fn could be triggered in an intermediate ent list state

        var entIsIntn = ent.id === intn.id;
        var entIsAlreadyPart = hasPid[ ent.id ];
        var isPotPart = !entIsIntn && !entIsAlreadyPart;

        if( isPotPart ){
          potPartPids.push( ent.id );
        }
      }

      model.set('_page.potentialParticipantIds', potPartPids);
    },

    interactionsWithParticipant: function( entId ){
      var ents = doc.entities();
      var retIntns = [];

      for( var i = 0; i < ents.length; i++ ){ // each ent
        var intn = ents[i];
        if( !intn.interaction ){ continue; } // skip non interactions

        var pids = intn.participantIds;
        
        for( var j = 0; j < pids.length; j++ ){ // each pid
          var pid = pids[j];

          if( pid === entId ){
            retIntns.push( intn );
            break;
          }
        }
      }

      return retIntns;
    },


    // ENTITY NAME
    ////////////////////////////////////////////////////////////////////////////////

    // .entityName( entId ) : gets the current entity name
    //
    // .entityName( entId, newName ) : sets the entity's name to a new one
    //
    // .entityName( function(entId, name){} ) : listens for when an entity's name is changed
    entityName: function( entityId, name ){
      var fn = arguments[0];

      if( isFunction(fn) ){
        model.on('change', '_page.doc.entities.*.name', function(id, newName, oldName){
          var entityId = id;
          fn( entityId, newName );
        });

      } else if( name === undefined ) {
        return model.get('_page.doc.entities.' + entityId + '.name');

      } else {
        var mEntity = model.at('_page.doc.entities').at(entityId);
        mEntity.set('name', name);
        mEntity.set('changedName', true);
      }
    },

    entityHasChangedName: function( entityId ){
      return model.get('_page.doc.entities.' + entityId + '.changedName') ? true : false;
    },



    // MISC ENTITY MANIPULATION
    ////////////////////////////////////////////////////////////////////////////////

    // NB: the viewport position of the entity is just the model position of the associated node
    // in cytoscape.js but the format could be made more complex to accomodate more info later, if needed
    //
    // .entityViewport( entId ) : gets the current viewport position of the entity
    // 
    // .entityViewport( entId, viewport ) : sets the current viewport position of the entity
    // 
    // .entityViewport( function(entId, viewport){} ) : listens for when an entity's viewport changes
    entityViewport: function( entityId, viewport ){
      var fn = arguments[0];

      if( isFunction(fn) ){
        model.on('change', '_page.doc.entities.*.viewport', function(id, newPos, oldPos){

          if( newPos.x === undefined || newPos.y === undefined ){
            return; // can't really do anything w/o a valid position
          }

          fn(id, newPos);
        });

      } else if( viewport === undefined ) {
        return model.get('_page.doc.entities.' + entityId + '.viewport');
      
      } else {
        model.set('_page.doc.entities.' + entityId + '.viewport', viewport);
      }
    },

    // set/get entity selection state
    entitySelected: function( entityId, selected ){
      if( selected === undefined ){
        return model.get('_page.entitySelected.' + entityId) ? true : false;
      } else {
        model.set('_page.entitySelected.' + entityId, selected ? true : false);
      }
    },


    removeAnnotations: function( entId ){
      model.set('_page.doc.entities.' + entId + '.annotation', '');
    },



    // ENTITY ASSOCIATION
    ////////////////////////////////////////////////////////////////////////////////

    entityIsAssociated: function( entityId ){
      return model.get('_page.doc.entities.' + entityId + '.association') ? true : false;
    },

    disassociateEntity: function( entityId ){
      var mEnt = model.at('_page.doc.entities').at(entityId)

      model.del('_page.associatedInfo.' + entityId);
      mEnt.del('association'); 

      var name = mEnt.get('name');
      this.getAssociatedEntitiesFromQuery(entityId, name);
    },

    entityWithAssociationAlreadyExists: function(db, dbId){
      var entities = model.get('_page.entities');

      for( var i = 0; i < entities.length; i++ ){
        var ent = entities[i];

        if( ent.association && ent.association.dbId === dbId && ent.association.db === db ){
          return ent;
        }
      }

      return false;
    },

    mergeEntities: function( entId, mergeInEntId ){
      var intns = this.interactionsWithParticipant( entId );

      // for each interaction connected to the entity, replace the connection with the associated entity
      for( var i = 0; i < intns.length; i++ ){
        var intn = intns[i];

        this.disconnectEntityFromInteraction( entId, intn.id );
        this.connectEntityToInteraction( mergeInEntId, intn.id );
      }

      // now that all connections have been replaced we don't need the entity anymore
      this.removeEntity( entId );
    },

    // NB: listener has format function( entityId, associationObj ){}
    associateEntityWithPotentialAtIndex: function( entityId, index ){
      var fn = arguments[0];

      if( isFunction(fn) ){
        model.on('change', '_page.doc.entities.*.association', function(id, assoc){
          fn( id, assoc );
        });

        return;
      }

      var mEntity = model.at('_page.doc.entities').at(entityId);
      var mAssoc = model.at('_page.potentialAssociations.' + entityId + '.' + index);
      var assoc = mAssoc.get();
      var assocdEnt;

      if( assocdEnt = doc.entityWithAssociationAlreadyExists(assoc.db, assoc.dbId) ){
        this.mergeEntities( entityId, assocdEnt.id );
        return;
      } 

      var mMoving = model.at('_page.movingDown.' + entityId);

      // give access to the full assoc data s.t. the ui can use it
      model.set('_page.associatedInfo.' + entityId, assoc); 
      mEntity.set('name', assoc.name);

      // visually move the entity down the list
      mMoving.set(true);
      setTimeout(function(){
        // the association only contains necessary fields s.t.
        // _populatedAssociation can be made from a textmining service call
        mEntity.set('association', {
          db: assoc.db,
          dbId: assoc.dbId,
          organismId: assoc.organismId
        });

        // we don't need these anymore
        model.set('_page.potentialAssociations.' + entityId, []);

        mMoving.set(false);
      }, 350); // NB sync w/ animation speed
    },

    entityAssociatedInfoIsLoaded: function( entityId ){
      return model.get('_page.associatedInfo.' + entityId) ? true : false;
    },

    loadAssociatedInfoForEntity: function( entityId, next ){
      var mEntity = model.at('_page.doc.entities').at(entityId);
      var assoc = mEntity.get('association');
      var mLoading = model.at('_page.loadingAssociatedInfo.' + entityId);
      var mInfo = model.at('_page.associatedInfo.' + entityId);

      var alreadyLoading = mLoading.get();
      var alreadyLoaded = mInfo.get();
      var shouldLoad = assoc && !alreadyLoading && !alreadyLoaded;

      if( shouldLoad ){
        mLoading.set(true);

        services.getEntityInfo(assoc, function(err, info){
          mInfo.set(info);
          mLoading.set(false);

          isFunction(next) && next();
        }); 
      }

    },

    // sets the list of potential associations for an entity
    // (you should get a list of associations from webservices)
    //
    // example association : { name: 'PCNA', fullName: 'Proliferating...', db: 'uniprot', dbId: 'P12004', organismName: 'homo sapiens', ... }
    setPotentialAssociationsForEntity: function( entityId, associations ){
      var ents = this.entities();
      var assocExists = {}; // db-dbId => true

      for( var i = 0; i < ents.length; i++ ){
        var ent = ents[i];
        var assoc = ent.association;

        if( assoc ){
          assocExists[ assoc.db + '-' + assoc.dbId ] = true;
        }
      }

      function assocAlreadyExists(db, dbId){
        return assocExists[ db + '-' + dbId ] ? true : false;
      }

      // set the index for each association s.t. we can use it in the UI templates
      for( var i = 0; associations && i < associations.length; i++ ){
        var assoc = associations[i];

        assoc.index = i;

        if( assocAlreadyExists(assoc.db, assoc.dbId) ){
          assoc.alreadyExists = true;
        }
      }

      model.set('_page.potentialAssociations.' + entityId, associations);
    },

    entityHasPotentialAssociations: function( entityId ){
      return model.get('_page.potentialAssociations.' + entityId) ? true : false;
    },

    getAssociatedEntitiesFromQuery: function(entityId, query, ok ){
      var thisChangeTime = lastAssociationQueryTime = +new Date; // time in unix epoch
      var mEnt = model.at('_page.doc.entities').at(entityId);
      var docId = model.get('_page.doc.id');
      var mLoading = model.at('_page.loadingPotentialAssociations.' + entityId);
      var mPotls = model.at('_page.potentialAssociations.' + entityId);

      if( !query || query.match(/$\s*^/) ){
        mPotls.set([]);
        mLoading.set(false);
        return;
      }

      var queryObj = {
        query: query,
        organismIds: []
      };
      var orgIsSupported = {};
      var atLeastOneOrg = false;
      var orgs = model.get('_page.organisms');
      for( var i = 0; i < orgs.length; i++ ){
        var org = orgs[i];
        var id = org.ncbiId + '';

        orgIsSupported[ id ] = true;

        if( this.organismIsEnabled(id) ){
          atLeastOneOrg = true;
          queryObj.organismIds.push( id );
        }
      }

      mLoading.set(true);
      services.getAssociatedEntitiesFromQuery( (atLeastOneOrg ? queryObj : query), function(err, entities){
        var thisQueryIsTheLatestOne = thisChangeTime >= lastAssociationQueryTime;

        if( thisQueryIsTheLatestOne ){
          mLoading.set(false);

          for( var i = 0; i < entities.length; i++ ){
            var ent = entities[i];
            var orgId = ent.organismId + '';

            if( orgIsSupported[orgId] ){
              ent.organismSupported = true;
            }
          }

          doc.setPotentialAssociationsForEntity( entityId, entities );
        }
      });
    },


    // POPOVERS
    ////////////////////////////////////////////////////////////////////////////////

    togglePopover: function( showVar, next ){
      var mPop = model.at('_page.popovers.' + showVar);
      var shown = mPop.get() ? true : false;

      if( !shown ){
        this.closeAllPopovers();
        mPop.set(true);
        model.set('_page.popoverOpen', true);
    
        next && next( true );
      } else {
        mPop.set(false);
        model.set('_page.popoverOpen', false);

        next && next( false );
      }
    },

    hidePopover: function( showVar, next ){
      var mPop = model.at('_page.popovers.' + showVar);
      var shown = mPop.get() ? true : false;

      if( !shown ){
        next && next( false );
      } else {
        mPop.set(false);
        model.set('_page.popoverOpen', false);
        next && next( false );
      }
    },

    showPopover: function( showVar, next ){
      var mPop = model.at('_page.popovers.' + showVar);
      var shown = mPop.get() ? true : false;

      if( !shown ){
        this.closeAllPopovers();
        mPop.set(true);
        model.set('_page.popoverOpen', true);
      
        next && next( true );
      } else {
        next && next( true );
      }
    },

    closeAllPopovers: function(){
      model.set('_page.popoverOpen', false);
      model.del('_page.popovers'); // => no popover flag is true
    },

    popoverIsOpen: function( showVar ){
      if( !showVar ){
        return model.get('_page.popoverOpen') ? true : false;
      } else {
        return model.get('_page.popovers.' + showVar) ? true : false;
      }
    },

    toggleTextmining: function( next ){
      this.togglePopover( 'textmining', next );
    },

    showTextmining: function( next ){
      this.showPopover( 'textmining', next );
    },

    hideTextmining: function( next ){
      this.hidePopover( 'textmining', next );
    },

    toggleEdit: function( entityId, next ){
      this.togglePopover( 'edit.' + entityId, next );
    },

    showEdit: function( entityId, next ){
      this.showPopover( 'edit.' + entityId, next );
    },

    showEditForLastAdded: function( next ){
      var id =  model.get('_page.entities.0.id');

      this.togglePopover( 'edit.' + id, next );
    },

    editOpen: function( entityId ){
      return this.popoverIsOpen( 'edit.' + entityId );
    },

    toggleAddParticipants: function( interactionId, next ){
      var open = model.get('_page.popovers.addParticipants.' + interactionId);
      var toggleWillOpen = !open;

      if( toggleWillOpen ){
        this.recalculatePotentialParticipants( interactionId );
      }

      this.togglePopover( 'addParticipants.' + interactionId, next );
    },

    toggleAnnotations: function( entId, next ){
      this.togglePopover( 'annotations.' + entId, next );
    },



    // TEXTMINING SUPPORT
    ////////////////////////////////////////////////////////////////////////////////

    // uses textmining to add entities to the document
    addEntitiesFromText: function(text, posFn, next){
      var doc = this;

      services.getPotentialEntitiesFromText(text, function(err, ents, orgIds){

        // console.log('getPotentialEntitiesFromText: err, ents, orgs', err, ents, orgIds);

        // see which organisms have been found and enable them in the filtering
        if( !orgIds || orgIds.length === 0 ){
          // no orgs => do nothing (we have no info to work with)
        } else {
          for( var i = 0; i < orgIds.length; i++ ){
            var orgId = orgIds[i];
            doc.disableAllOrganisms();
            doc.enableOrganism( orgId );
          }
        }

        // using this textmining function gives temporary integer ids we
        // need to replace
        ents = replaceTempIds( ents );
        ents = doc.makeEntities( ents );

        // add ent's
        for( var i = 0; i < ents.length; i++ ){
          var ent = ents[i];

          if( posFn ){ // if specified, use the position function to place the entity
            ent.viewport = posFn();
          }

          // b/c the textmining "set" the name for the user
          ent.changedName = true;

          doc.addEntity( ent );
        }
        
        if( ents.length > 0 ){
          var stage = model.get('_page.doc.stage');
          if( stage === 'textmining' ){
            model.set('_page.doc.stage', 'organisms');
          }
        }

        next( ents.length );
      });
    },



    // ORGANISM SUPPORT 
    ////////////////////////////////////////////////////////////////////////////////

    progressOrganismStage: function(){
      var mStage = model.at('_page.doc.stage');
      if( mStage.get() === 'organisms' ){
        mStage.set('entities');
      }
    },

    organismIsEnabled: function( id ){
      return model.get('_page.doc.organismEnabled.ncbi' + id) ? true : false;
    },

    toggleOrganism: function( id ){
      var mEnabled = model.at('_page.doc.organismEnabled.ncbi' + id);

      if( mEnabled.get() ){
        mEnabled.set(false);
      } else {
        mEnabled.set(true);
      }

      this.progressOrganismStage();
    },
    
    enableOrganism: function( id ){
      var mEnabled = model.at('_page.doc.organismEnabled.ncbi' + id);

      mEnabled.set(true);

      this.progressOrganismStage();
    },

    disableOrganism: function( id ){
      var mEnabled = model.at('_page.doc.organismEnabled.ncbi' + id);

      mEnabled.set(false);

      this.progressOrganismStage();
    },

    disableAllOrganisms: function(){
      var orgs = model.get('_page.organisms');

      for( var i = 0; i < orgs.length; i++ ){
        var orgId = orgs[i].id + '';

        model.set('_page.doc.organismEnabled.' + orgId, false);
      }
    },

    resetOrganisms: function(){
      var orgs = model.get('_page.organisms');

      for( var i = 0; i < orgs.length; i++ ){
        var orgId = orgs[i].id + '';

        model.set('_page.doc.organismEnabled.' + orgId, true);
      }
    },


    // EXPORT SUPPORT 
    ////////////////////////////////////////////////////////////////////////////////


    exportAsSif: function(){
      var bb = new BlobBuilder;
      var nodeIncluded = {}; // id => true/false
      var usedName = {}; // name => true/false
      var idToName = {};
      var inters = this.interactions();
      var ents = this.entities();

      function getName( origName, id ){ // may already be used and then transformed
        var i = 2;
        var name = origName;

        if( idToName[ id ] ){
          return idToName[ id ];
        }

        while( usedName[ name ] ){
          name = origName + '-' + (i++);
        }

        usedName[ name ] = true;
        idToName[ id ] = name;

        return name;
      }

      // include all interactions
      for( var i = 0; i < inters.length; i++ ){
        var inter = inters[i];
        var interName = getName( inter.name, inter.id );
        var pids = inter.participantIds;
        var type = 'interacts-with';

        for( var j = 0; j < pids.length; j++ ){
          var pid = pids[j];
          var name = getName( model.at('_page.doc.entities').at(pid).at('name').get(), pid );
          
          bb.append( interName );
          bb.append( '\t' + type + '\t' );
          bb.append( name );
          bb.append( '\n' );

          nodeIncluded[ inter.id ] = true;
          nodeIncluded[ pid ] = true;
        }

        
      }

      // include entities not included in interactions
      for( var i = 0; i < ents.length; i++ ){
        var ent = ents[i];

        if( nodeIncluded[ ent.id ] ){
          continue;
        }

        var name = getName( ent.name, ent.id );

        bb.append( name );
        bb.append( '\n' );

        nodeIncluded[ ent.id ] = true;
      }

      saveAs(bb.getBlob("text/plain;charset=utf-8"), "factoid.sif");
    },



    // STAGE SUPPORT
    ////////////////////////////////////////////////////////////////////////////////

    resetStages: function(){
      model.set('_page.doc.stage', 'textmining');
    },

    goToStage: function( stage ){
      var fn = arguments[0];

      if( isFunction(fn) ){
        model.on('change', '_page.doc.stage', function(stage){
          fn( stage );
        });

        return;
      }

      model.set('_page.doc.stage', stage);
    },

    getStage: function(){
      return model.get('_page.doc.stage');
    },



    // LAYOUT SUPPORT
    ////////////////////////////////////////////////////////////////////////////////

    // NB: function runLayoutFn( next )
    initLayoutIfNecessary: function( runLayoutFn ){
      if( model.get('_page.doc.needsInitialLayout') ){
        runLayoutFn( function(){
          model.set('_page.doc.needsInitialLayout', false);
        } );
      }
      
    },


    // ABOUT / INFO OVERLAY
    ////////////////////////////////////////////////////////////////////////////////

    showOverlay: function( id ){
      model.set('_page.showOverlay.' + id, true);
    },

    hideOverlay: function( id ){
      model.set('_page.showOverlay.' + id, false);
    }
  };
};