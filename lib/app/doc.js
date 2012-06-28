// functions that are exposed to the client side
module.exports = function( model ){

  function isFunction( obj ){
    return typeof obj === "function";
  }

  return {

    addEntity: function( entity ){
      var path = "_doc.entities";

      var fn = arguments[0];
      if( isFunction( fn ) ){ // then bind to when an entity is added to the doc
        model.on( "push", path, fn );

      } else { // then add the entity to the doc
        if( entity.id === undefined ){ // then generate an id for the entity
          entity.id = model.id(); 
        }
        model.push( path, entity );
      }
    },

    removeEntity: function( entityId ){
      var path = "_doc.entities";

      var fn = arguments[0];
      if( isFunction( fn ) ){ // then bind to when an entity is removed from the doc
        model.on( "remove", path, fn );

      } else { // then add the entity to the doc
        model.push( path, entity );
      }
    },

    connectEntityToInteraction: function( interactionId, entityId ){

    },

    entityName: function( entityId, name ){

    },



  };
};