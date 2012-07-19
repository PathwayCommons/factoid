// bind keyboard shortcuts

$(function(){

  var $graph = $('#graph');
  var $body = $('body');

  // regular shortcuts
  Mousetrap.bind(['del', 'backspace'],function(){ cyutil.deleteSelectedEntitiesInDoc(); return false; }); // return false since backspace may go back
  Mousetrap.bind('e', function(){ cyutil.addEntityInGoodPosition(); });
  Mousetrap.bind('i', function(){ cyutil.addInteractionInGoodPosition(); });
  Mousetrap.bind('r', function(){ cyutil.relayout(); });
  Mousetrap.bind('/', function(){ $('#textmining-button').qtip('api').show(); });
  Mousetrap.bind('f', function(){ cy.fit(); });

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

  // zooming shortcuts
  Mousetrap.bind(['+', '='], function(){ plus = true; }, 'keydown');
  Mousetrap.bind(['+', '='], function(){ plus = false; }, 'keyup');
  Mousetrap.bind(['-', '_'], function(){ minus = true; }, 'keydown');
  Mousetrap.bind(['-', '_'], function(){ minus = false; }, 'keyup');

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

    if( down ){ y -= panStep; }
    if( up ){ y += panStep; }

    if( right ){ x -= panStep; }
    if( left ){ x += panStep; }

    cy.panBy({
      x: x,
      y: y
    });
  }

  Mousetrap.bind('up', function(){ up = true; }, 'keydown');
  Mousetrap.bind('up', function(){ up = false; }, 'keyup');

});