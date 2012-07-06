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
          textOutlineWidth: 2
        })
      .selector('node:selected')
        .css({
          borderWidth: 3,
          borderColor: '#fdb722'
        })
      .selector('node[type="interaction"]')
        .css({
          height: 20,
          width: 20,
          shape: 'rectangle',
          content: ''
        })
      .selector('edge')
        .css({
          width: 2
        })
    ,

    ready: function( cy ){
      window.cy = cy;

      var json = cyutil.entities2json( doc.entities() );
      cy.add( json );
    }
  }); // cytocsape

  // inject arbor into the page
  // unfortunately, we need to do include it this way for webworkers to work properly
  $('head').append('<script type="text/javascript" src="/js/arbor.js"></script>');

  // add element to cytoscape when an element is added in the model
  doc.addEntity(function( entity ){
    var ele = cy.add({
      group: 'nodes',
      position: entity.viewport,
      data: {
        id: entity.id,
        name: entity.name,
        type: entity.type
      },
      classes: 'entity' + ( entity.interaction ? ' interaction' : '' )
    });
  });

  // remove element from cytoscape when its entity is removed from the model
  doc.removeEntity(function( entityId ){
    cy.getElementById(entityId).remove();
  });

  // code for keeping a record of updated node positions
  var movedNodes = [];
  var movedNode = {};
  function updateNodePosition( node ){
    var id = node.id();
    var alreadyHandled = movedNode[ id ];

    if( !alreadyHandled ){
      movedNodes.push( node );
      movedNode[ id ] = true;
    }
  }

  // update node positions in the model periodically
  setInterval(function(){
    // get the lists and set to empty so we're not handling more events as they come in
    var mNodes = movedNodes;
    var mNode = movedNode;
    movedNodes = [];
    movedNode = {};

    for( var i = 0; i < mNodes.length; i++ ){ // for each node
      var node = mNodes[i];
      var pos = node.position();
      var id = node.id();

      doc.entityViewport( id, pos );
    } 
  }, 1000/60); // 60 fps

  // when a node is moved, update its position
  $graph.cytoscape(function(e){
    cy.on('drag', 'node', function(){ // note: only on drag (otherwise we could get an infite loop with `position`)
      updateNodePosition(this);
    });

    cy.on('layoutstop', function(){ // also update position after a layout finishes (but not during)
      var nodes = cy.nodes();

      for( var i = 0; i < nodes.length; i++ ){
        var node = nodes[i];

        updateNodePosition(node);
      }
    });
  });

  // when clicking an entity, highlight it
  $graph.cytoscape(function(e){
    cy
      .on('click', 'node', function(){
        var node = this;
        var id = node.data('id');
        var $entity = $( document.getElementById('entity-' + id) );

        $entity.addClass('highlighted');

        $('#info').scrollTo($entity, {
          duration: 250,
          axis: 'y',
          onAfter: function(){
            setTimeout(function(){
              $entity.removeClass('highlighted');
            }, 250);
          }
        });

      })
    ;
  });

  // when the viewport is updated on the server, update its node position
  doc.entityViewport(function(entityId, viewport){
    cy.getElementById(entityId).position( viewport );
  });

  // update names when the doc changes
  doc.entityName(function(entityId, name){
    cy.getElementById( entityId ).data( 'name', name );
  });

  doc.connectEntityToInteraction(function(entityId, interactionId){
    cy.add({
      group: 'edges',
      data: {
        source: entityId,
        target: interactionId
      }
    });
  });

  doc.disconnectEntityFromInteraction(function(entityId, interactionId){
    var ent = cy.getElementById( entityId );
    var inter = cy.getElementById( interactionId );

    var edge = ent.edgesTo( inter );
    edge.remove();
  });
  
});