// utility functions useful for cytoscape.js integration

window.cyutil = {

  relayout: function(){
    var canLayout = cy.nodes().length !== 0;
    if( !canLayout ){ return }

    cy
      .one('layoutstop', function(){
        cy.nodes().trigger('updateposition'); // indicate the nodes should update entity position after the layout is done
      })

      .layout({
        name: 'arbor',
        precision: 0.8,
        stepSize: 1,
        stableEnergy: function( energy ){
          var e = energy; 
          return (e.max <= 0.5) || (e.mean <= 0.5);
        }
      })
    ;
  },

  deleteSelectedEntitiesInDoc: function(){
    var nodes = cy.$('node:selected');

    for( var i = 0; i < nodes.length; i++ ){
      var node = nodes[i];
      var id = node.data('id');

      doc.removeEntity( id );
    }
  },

  addEntityInGoodPosition: function(){
    doc.addEntity({
      viewport: cyutil.getNewEntityPosition()
    });
  },

  addInteractionInGoodPosition: function(){
    doc.addInteraction({
      viewport: cyutil.getNewEntityPosition()
    });
  },

  entities2json: function( entities ){
    var ents = [], ints = [];
    var json = {
      nodes: [],
      edges: []
    };

    // add nodes & build list of entities, interactions
    for( var i = 0; i < entities.length; i++ ){
      var entity = entities[i];

      if( entity.type === 'entity' ){
        ents.push( entity );
      } else if( entity.type === 'interaction' ){
        ints.push( entity );
      }

      json.nodes.push({
        data: entity,
        position: entity.viewport
      });
    }

    // add edges based on interaction participants
    for( var i = 0; i < ints.length; i++ ){
      var interaction = ints[i];

      var pids = interaction.participantIds;
      for( var j = 0; j < pids.length; j++ ){
        var pid = pids[j];

        json.edges.push({
          data: {
            source: pid,
            target: interaction.id
          }
        });
      } // for pids
    } // for interactions

    return json;
  },

  getNewEntityPosition: function(){
    var $graph = $('#graph');
    var maxX = $graph.width();
    var maxY = $graph.height();
    var stepSize = 100;
    var rpos = { x: stepSize, y: stepSize };
    var distThreshold = stepSize * 0.66;
    var nodes = cy.nodes();
    var nrposes = [];

    // get all the rendered positions
    for( var i = 0; i < nodes.length; i++ ){
      var nrpos = nodes[i].renderedPosition();
      nrposes.push( nrpos );
    }

    // adjust the rpos until we're not in the way of anything
    for(;;){
      var somethingsTooClose = false;

      // check if any node is too close
      for( var i = 0; i < nrposes.length; i++ ){
        var nrpos = nrposes[i];
        var dist = Math.sqrt(
          (rpos.x - nrpos.x)*(rpos.x - nrpos.x) +
          (rpos.y - nrpos.y)*(rpos.y - nrpos.y)
        );

        if( dist < distThreshold ){
          somethingsTooClose = true;
          break;
        }
      } // for nrposes

      if( somethingsTooClose ){ // then step the rendered position, and continue
        rpos.x += stepSize;

        if( rpos.x > maxX - stepSize ){ // then go to the next line
          rpos.x = stepSize;
          rpos.y += stepSize;
        }

        if( rpos.y > maxY - stepSize ){ // then just add at a good starting position
          rpos = { x: stepSize, y: stepSize };
          break;
        }

      } else {
        break;
      }
    } // for

    var pan = cy.pan();
    var zoom = cy.zoom();

    return {
      x: (rpos.x - pan.x)/zoom,
      y: (rpos.y - pan.y)/zoom
    };
  }

};