$(function(){
	var $graph = $('#graph');

  $graph.cytoscape({
    style: $.cytoscape.stylesheet()
      .selector('node')
        .css({
          height: 40,
          width: 40,
          content: 'data(name)',
          textValign: 'center',
          textHalign: 'center',
          color: 'white',
          backgroundColor: '#888',
          textOutlineColor: '#888',
          textOutlineWidth: 3
        })
      .selector('node:selected')
        .css({
          borderWidth: 3,
          borderColor: '#fdb722'
        })
      .selector('edge')
        .css({
          width: 2
        })
    ,

    ready: function( cy ){
      window.cy = cy;
    }
  }); // cytocsape

  // add element to cytoscape when an element is added in the model
  doc.addEntity(function( entity ){
    var $graph = $('#graph');
    var maxX = $graph.width();
    var maxY = $graph.height();
    var stepSize = 85;
    var rpos = { x: stepSize, y: stepSize };
    var distThreshold = stepSize * 0.66;
    var nodes = cy.nodes();
    var nrposes = [];

    // get all the rendered positions
    for( var i = 0; i < nodes.length; i++ ){
      var nrpos = nodes[i].renderedPosition();
      nrposes.push( nrpos );
    }

    for(;;){
      var somethingsTooClose = false;

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
    }

    var ele = cy.add({
      group: 'nodes',
      data: entity,
      renderedPosition: rpos
    });

    doc.entityViewport( ele.position() );
  });

  doc.removeEntity(function( entityId ){
    cy.getElementById(entityId).remove();
  });

  
});