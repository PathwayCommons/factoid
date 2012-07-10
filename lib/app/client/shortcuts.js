// bind keyboard shortcuts

$(function(){

  var $graph = $('#graph');
  var $body = $('body');

  $body
    .on('keydown.del keydown.backspace', function(){
      cyutil.deleteSelectedEntitiesInDoc();
      return false; // since backspace may go back
    })

    .on('keydown.e', function(){
      cyutil.addEntityInGoodPosition();
    })

    .on('keydown.i', function(){
      cyutil.addInteractionInGoodPosition();
    })

    .on('keydown.r', function(){
      cyutil.relayout();
    })

    .on('keydown./', function(){
      // TODO open textmining ui
    })

    .on('keydown.f', function(){
      cy.fit();
    })
  ;

  // zooming metrics
  var zoomStep = 0.0125;
  var zoomDelta = 1000/60; // in ms (currently 60 fps)
  var plus, minus; // are the plus or minus keys being pressed

  var zoomingInterval = setInterval(function(){
    if( plus || minus ){
      zoom();
    }
  });

  function zoom(){
    var zoom = cy.zoom();
    var renCenter = {
      x: $graph.width()/2,
      y: $graph.height()/2
    };

    if( plus ){
      zoom *= (1 + zoomStep);
    }

    if( minus ){
      zoom *= ( 1 - zoomStep );
    }

    cy.zoom({
      level: zoom,
      renderedPosition: renCenter
    });
  }

  // TODO refactor this when jquery.hotkeys supports + and - properly so the code is less verbose
  // keep track of whether the plus and minus keys are being pressed
  var plusCode = 187;
  var minusCode = 189;
  $body
    .on('keydown', function(e){
      switch( e.which ){
        case plusCode:
          plus = true;
          break;

        case minusCode:
          minus = true;
          break;
      }
    })

    .on('keyup', function(e){
      switch( e.which ){
        case plusCode:
          plus = false;
          break;

        case minusCode:
          minus = false;
          break;
      }
    })
  ;

  // panning metrics
  var panStep = 3;
  var panDelta = 1000/60; // in ms (currently set to 60 fps)
  var up, down, left, right; // what arrow keys are down

  // if one or more of the arrow keys are down, then pan on a regular interval so panning is smooth
  var panningInterval = setInterval(function(){
    if( up || down || left || right ){
      pan();
    }
  }, panDelta);

  // pan according to the flags set for the arrow keys
  function pan(){
    var x = 0;
    var y = 0;

    if( down ){
      y -= panStep;
    }
    if( up ){
      y += panStep;
    }

    if( right ){
      x -= panStep;
    }
     if( left ){
      x += panStep;
    }

    cy.panBy({
      x: x,
      y: y
    });
  }

  // set up bindings to keep track of which arrow keys are down
  $body
    .on('keydown.up', function(){
      up = true;
    })
    .on('keyup.up', function(){
      up = false;
    })

    .on('keydown.down', function(){
      down = true;
    })
    .on('keyup.down', function(){
      down = false;
    })

    .on('keydown.left', function(){
      left = true;
    })
    .on('keyup.left', function(){
      left = false;
    })

    .on('keydown.right', function(){
      right = true;
    })
    .on('keyup.right', function(){
      right = false;
    })
    
  ;

});