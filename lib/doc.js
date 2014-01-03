// the document controller (used to modify a currently-loaded document)

module.exports = function( model, srvs ){

  var doc; // internal ref

  // if services are specified manually (i.e. serverside) then use those
  // otherwise (i.e. clientside) it's defined for us as window.services
  if( srvs ){
    services = srvs;
  }

  // TODO when derby fn is working replace
  function modelId(){

    function rand(){
      return Math.round( Math.random() * 1000000 );
    }

    return 'fake-model-id-' + rand() + '-' + rand() + '-' + rand() + '-' + rand();
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

      return model.subscribe(docPath, 'organisms', function(err){
        model.setNull(docPath, { // create the empty new doc if it doesn't already exist
          id: docId
        });

        // from the global organisms collection, create a list we can use in the ui
        var orgSort = model.sort('organisms', function(org1, org2){
          var str1 = org1.name;
          var str2 = org2.name;

          return ( ( str1 == str2 ) ? 0 : ( ( str1 > str2 ) ? 1 : -1 ) );
        });
        orgSort.ref('_page.organisms');

        // create a reference to the document
        model.ref('_page.doc', 'documents.' + docId);

        // from the list of organisms, set each to enabled by default
        var orgs = model.get('_page.organisms');
        for( var i = 0; i < orgs.length; i++ ){
          var org = orgs[i];
          var id = org.id;

          model.setNull('_page.doc.organismEnabled.' + id, true);
        }

        // the default stage of a doc is textmining
        model.setNull('_page.doc.stage', 'textmining');

        // create a list of entities in the document that we can use in the ui
        var entFilter = model.filter('documents.' + docId + '.entities');
        entFilter.ref('_page.entities');

        // create a list of entities in the document that we can use in the ui
        var intFilter = model.filter('documents.' + docId + '.entities', function(entity){
          return entity.interaction;
        });
        intFilter.ref('_page.interactions');

        return next();

      });
    },

    // listeners needed to keep the model in check
    // NB should be called client side only at init
    addInitListeners: function(){
      // keep track of whether an entity's name has been changed
      model.on('change', '_page.doc.entities.*.name', function(id, name, oldName){
        var mEnt = model.at('_page.doc.entities').at(id);
        mEnt.set('changedName', true);
      });

      function setupParticipantsRef( entId ){
        model.refList(
          '_page.participants.' + entId,
          '_page.doc.entities',
          '_page.doc.entities.' + entId + '.participantIds',
          { deleteRemoved: false }
        );
      }

      // set up participants list for all already existing interactions
      var ents = model.get('_page.entities');
      for( var i = 0; i < ents.length; i++ ){
        var ent = ents[i];

        if( ent.interaction ){
          setupParticipantsRef( ent.id );
        }
      }

      // set up participants list for newly added interactions
      model.on('insert', '_page.doc.entities.*.participantIds', function( interactionId, index, values ){
        setupParticipantsRef( interactionId );
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
        model.set( "_page.doc.entities." + entity.id, entity );
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
            var entity = prev;
            fn( entity );
          }
        });
        return;

      } else { // then remove the entity from the doc

        // remove the entity
        model.del('_page.doc.entities.' + entityId);

        // TODO remove interactions that are hanging from deleting this entity

        // remove references to the entity in interactions
        var ints = model.get('_page.interactions');
        for( var i = 0; i < ints.length; i++ ){
          var intn = ints[i];
          var intnId = intn.id;
          var pids = ints[i].participantIds;
          var indicesToRemove = [];

          // get indices of 
          for( var j = 0; j < pids.length; j++ ){
            var pid = pids[j];

            if( pid === entityId ){
              indicesToRemove.push( j );
            }
          }

          for( var j = 0; j < indicesToRemove.length; j++ ){
            var index = indicesToRemove[j];

            model.remove('_page.doc.entities.' + intnId + '.participantIds', index, 1);
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
        model.on('change', '_entities.*.name', function(index, newName, oldName){
          var entityId = model.get('_entities.' + index + '.id');
          fn( entityId, newName );
        });

      } else if( name === undefined ) {
        return model.get('entities.' + entityId + '.name');

      } else {
        var mEntity = model.at('entities').at(entityId);
        mEntity.set('name', name);
        mEntity.set('changedName', true);
      }
    },

    entityHasChangedName: function( entityId ){
      return model.get('entities.' + entityId + '.changedName') ? true : false;
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
        model.on('change', '_entities.*.viewport', function(index, newPos, oldPos){

          if( isLocal ){ return; } // don't trigger if we moved it (since we're already up-to-date)

          if( newPos.x === undefined || newPos.y === undefined ){
            return; // can't really do anything
          }

          var id = model.get('_entities.' + index + '.id');
          fn(id, newPos);
        });

      } else if( viewport === undefined ) {
        return model.get('entities.' + entityId + '.viewport');
      
      } else {
        model.set('entities.' + entityId + '.viewport', viewport);
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
      model.set('entities.' + entId + '.annotation', '');
    },



    // ENTITY ASSOCIATION
    ////////////////////////////////////////////////////////////////////////////////

    entityIsAssociated: function( entityId ){
      return model.get('entities.' + entityId + '.association') ? true : false;
    },

    disassociateEntity: function( entityId ){
      var mEnt = model.at('entities').at(entityId)

      model.del('_page.associatedInfo.' + entityId);
      mEnt.del('association'); 

      var name = mEnt.get('name')
      doc.getAssociatedEntitiesFromQuery(entityId, name);
    },

    entityWithAssociationAlreadyExists: function(db, dbId){
      var entities = model.get('_entities');

      for( var i = 0; i < entities.length; i++ ){
        var ent = entities[i];

        if( ent.association && ent.association.dbId === dbId && ent.association.db === db ){
          return true;
        }
      }

      return false;
    },

    // NB: listener has format function( entityId, associationObj ){}
    associateEntityWithPotentialAtIndex: function( entityId, index ){
      var fn = arguments[0];

      if( isFunction(fn) ){
        model.on('change', 'entities.*.association', function(id, assoc){
          fn( id, assoc );
        });

        return;
      }

      var mEntity = model.at('entities').at(entityId);
      var assoc = mEntity.get('_potentialAssociations.' + index);
      
      if( doc.entityWithAssociationAlreadyExists(assoc.db, assoc.dbId) ){
        mEntity.set('_potentialAssociations.' + index + '._alreadyExists', true);
        return;
      } 

      // the association only contains necessary fields s.t.
      // _populatedAssociation can be made from a textmining service call
      mEntity.set('association', {
        db: assoc.db,
        dbId: assoc.dbId,
        organismId: assoc.organismId
      });

      // give access to the full assoc data s.t. the ui can use it
      mEntity.set('_associatedInfo', assoc); 
      mEntity.set('name', assoc.name);

      // we don't need these anymore
      mEntity.set('_potentialAssociations', []);

      var index;
      var ents = model.get('_entities');
      for( var i = 0; i < ents.length; i++ ){
        if( ents[i].id === entityId ){
          index = i;
          break;
        }
      }

      if( ents.length !== 1 ){
        mEntity.set('_movingDown', true);

        setTimeout(function(){
          mEntity.set('_movingDown', false);
          model.move('_entities', index, ents.length - 1);
        }, 350); // NB sync w/ css ani'n
      }
    },

    entityAssociatedInfoIsLoaded: function( entityId ){
      return model.get('entities.' + entityId + '._associatedInfo') ? true : false;
    },

    loadAssociatedInfoForEntity: function( entityId, next ){
      var mEntity = model.at('entities').at(entityId);
      var assoc = mEntity.get('association');

      var alreadyLoading = mEntity.get('_loadingAssociatedInfo');
      var alreadyLoaded = mEntity.get('_associatedInfo');
      var shouldLoad = assoc && !alreadyLoading && !alreadyLoaded;

      if( shouldLoad ){
        mEntity.set('_loadingAssociatedInfo', true);

        services.getEntityInfo(assoc, function(err, info){
          mEntity.set('_associatedInfo', info);
          mEntity.set('_loadingAssociatedInfo', false);

          isFunction(next) && next();
        }); 
      }

    },

    // sets the list of potential associations for an entity
    // (you should get a list of associations from webservices)
    //
    // example association : { name: 'PCNA', fullName: 'Proliferating...', db: 'uniprot', dbId: 'P12004', organismName: 'homo sapiens', ... }
    setPotentialAssociationsForEntity: function( entityId, associations ){
      // set the index for each association s.t. we can use it in the UI templates
      for( var i = 0; associations && i < associations.length; i++ ){
        associations[i].index = i;
      }

      model.set('entities.' + entityId + '._potentialAssociations', associations);
    },

    entityHasPotentialAssociations: function( entityId ){
      return model.get('entities.' + entityId + '._potentialAssociations') ? true : false;
    },

    getAssociatedEntitiesFromQuery: function(entityId, query, ok ){
      var thisChangeTime = lastAssociationQueryTime = +new Date; // time in unix epoch
      var mEnt = model.at('entities').at(entityId);
      var docId = model.get('_doc.id');

      if( !query || query.match(/$\s*^/) ){
        mEnt.set('_potentialAssociations', []);
        mEnt.set('_loadingPotentialAssociations', false);
        return;
      }

      var queryObj = {
        query: query,
        organismIds: []
      };
      var orgIsSupported = {};
      var atLeastOneOrg = false;
      var orgs = model.get('organisms');
      for( var i = 0; i < orgs.length; i++ ){
        var org = orgs[i];
        var id = org.id + '';

        orgIsSupported[ id ] = true;

        if( org.documents && org.documents[ docId ] && org.documents[ docId ].enabled ){
          atLeastOneOrg = true;
          queryObj.organismIds.push( id );
        }
      }

      mEnt.set('_loadingPotentialAssociations', true);
      services.getAssociatedEntitiesFromQuery( (atLeastOneOrg ? queryObj : query), function(err, entities){
        var thisQueryIsTheLatestOne = thisChangeTime >= lastAssociationQueryTime;

        if( thisQueryIsTheLatestOne ){
          mEnt.set('_loadingPotentialAssociations', false);

          for( var i = 0; i < entities.length; i++ ){
            var ent = entities[i];
            var orgId = ent.organismId + '';

            if( orgIsSupported[orgId] ){
              ent._organismSupported = true;
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

    popoverIsOpen: function(){
      return model.get('_page.popoverOpen');
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

    toggleAddParticipants: function( interactionId, next ){
      togglePopover( 'addParticipants.' + interactionId, next );
    },

    toggleAnnotations: function( entId, next ){
      togglePopover( entId + '.showAnnotations', next );
    },



    // TEXTMINING SUPPORT
    ////////////////////////////////////////////////////////////////////////////////

    // uses textmining to add entities to the document
    addEntitiesFromText: function(text, posFn, next){
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
        ents = this.makeEntities( ents );

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

        // update participants list for int'ns
        for( var i = 0; i < ents.length; i++ ){
          var ent = ents[i];

          if( ent.interaction ){
            doc.updateParticipantsList( ent.id );
          }
        }
        
        if( ents.length > 0 ){
          var stage = model.get('_doc.stage');
          if( stage === 'textmining' ){
            model.set('_doc.stage', 'organisms');
          }
        }

        next( ents.length );
      });
    },



    // ORGANISM SUPPORT 
    ////////////////////////////////////////////////////////////////////////////////

    toggleOrganism: function( id ){
      var docId = model.get('_doc.id');
      var orgs = model.get('organisms');
      id = '' + id;
      
      for( var i = 0; i < orgs.length; i++ ){
        var org = orgs[i];
        var orgId = org.id + '';
        var enabled = model.get('organisms.' + i + '.documents.' + docId + '.enabled');

        if( id === orgId ){
          model.set('organisms.' + i + '.documents.' + docId + '.enabled', !enabled);

          var stage = model.get('_doc.stage');
          if( stage === 'organisms' ){
            model.set('_doc.stage', 'entities');
          }

          break;
        }
      }
    },
    
    enableOrganism: function( id ){
      var docId = model.get('_doc.id');
      var orgs = model.get('organisms');
      id = '' + id;

      for( var i = 0; i < orgs.length; i++ ){
        var orgId = orgs[i].id + '';

        if( id === orgId ){
          model.set('organisms.' + i + '.documents.' + docId + '.enabled', true);

          var stage = model.get('_doc.stage');
          if( stage === 'organisms' ){
            model.set('_doc.stage', 'entities');
          }

          break;
        }
      }
    },

    disableOrganism: function( id ){
      var docId = model.get('_doc.id');
      var orgs = model.get('organisms');
      id = '' + id;

      for( var i = 0; i < orgs.length; i++ ){
        var orgId = orgs[i].id + '';

        if( id === orgId ){
          model.set('organisms.' + i + '.documents.' + docId + '.enabled', false);

          var stage = model.get('_doc.stage');
          if( stage === 'organisms' ){
            model.set('_doc.stage', 'entities');
          }

          break;
        }
      }
    },

    disableAllOrganisms: function(){
      var docId = model.get('_doc.id');
      var orgs = model.get('organisms');

      for( var i = 0; i < orgs.length; i++ ){
        var orgId = orgs[i].id + '';

        model.set('organisms.' + i + '.documents.' + docId + '.enabled', false);
      }
    },

    resetOrganisms: function(){
      var docId = model.get('_doc.id');
      var orgs = model.get('organisms');

      for( var i = 0; i < orgs.length; i++ ){
        var orgId = orgs[i].id + '';

        model.set('organisms.' + i + '.documents.' + docId + '.enabled', true);
      }
    },


    // EXPORT SUPPORT 
    ////////////////////////////////////////////////////////////////////////////////


    exportAsSif: function(){
      var bb = new BlobBuilder;
      
      var inters = model.filter('_entities').where('interaction').equals(true).get();
      for( var i = 0, inter; i < inters.length && (inter = inters[i]); i++ ){
        var pids = inter.participantIds;
        var type = inter.type;

        for( var j = 0, pid; j < pids.length && (pid = pids[j]); j++ ){
          var name = model.at('entities').at(pid).at('name').get();
          bb.append(name);

          if( j === 0 ){
            bb.append('\t' + type + '\t');
          }

          if( j !== pids.length - 1 ){
            bb.append('\t');
          }
        }

        bb.append('\n');
      }

      saveAs(bb.getBlob("text/plain;charset=utf-8"), "factoid.sif");
    },



    // STAGE SUPPORT
    ////////////////////////////////////////////////////////////////////////////////

    resetStages: function(){
      model.set('_doc.stage', 'textmining');
    },

    goToStage: function( stage ){
      model.set('_doc.stage', stage);
    },

    getStage: function(){
      return model.get('_doc.stage');
    },



    // LAYOUT SUPPORT
    ////////////////////////////////////////////////////////////////////////////////

    // NB: function runLayoutFn( next )
    initLayoutIfNecessary: function( runLayoutFn ){
      if( model.get('_doc.needsInitialLayout') ){
        runLayoutFn( function(){
          model.set('_doc.needsInitialLayout', false);
        } );
      }
      
    }

  };
};