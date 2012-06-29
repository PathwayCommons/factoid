window.cyutil = {

  deleteSelectedEntitiesInDoc: function(){
    var nodes = cy.$('node:selected');

    for( var i = 0; i < nodes.length; i++ ){
      var node = nodes[i];
      var id = node.data('id');

      doc.removeEntity( id );
    }
  },

  entities2json: function( entities ){
    var ents = [], ints = [];
    var json = {
      nodes: [],
      edges: []
    };

    for( var i = 0; i < entities.length; i++ ){
      var entity = entities[i];

      if( entity.type === 'entity' ){
        ents.push( entity );
      } else if( entity.type === 'interaction' ){
        ints.push( entity );
      }

      json.nodes.push({
        data: ent,
        position: ent.viewport
      });
    }

    for( var i = 0; i < ints.length; i++ ){
      var interaction = ints[i];

      var pids = interaction.participantIds;
      for( var j = 0; j < pids.length; j++ ){
        var pid = pids[j];

        json.edges.push({
          data: {
            source: interaction.id,
            target: pid
          }
        });
      } // for pids
    } // for interactions
  } // entities2json

};