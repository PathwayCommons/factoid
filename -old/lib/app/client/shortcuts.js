// bind keyboard shortcuts

$(function(){

  var $graph = $('#graph');
  var $body = $('html');

  // regular shortcuts
  Mousetrap.bind(['del', 'backspace'],function(){ cyutil.deleteSelectedEntitiesInDoc(); return false; }); // return false since backspace may go back
  
  Mousetrap.bind('e', function(){
    cyutil.addEntityInGoodPosition(); 
    doc.showEditForLastAdded(function(){
      ui.focusWhenVisible( 'edit-name-input-' + doc.getLastAddedEntity().id );
    });
  });
  Mousetrap.bind('i', function(){ cyutil.addInteractionInGoodPosition(); doc.showEditForLastAdded(); });
  
  Mousetrap.bind('r', function(){ cyutil.relayout(); });
  Mousetrap.bind('t', function(){ $('#textmining-button').qtip('api').show(); });
  Mousetrap.bind('f', function(){ cy.fit(); });

  // hide qtips on escape key
  Mousetrap.bind('esc', function(){
    var $qtips = $('.qtip:visible');

    for( var i = 0; i < $qtips.length; i++ ){
      var $qtip = $( $qtips[i] );
      var api = $qtip.qtip('api');

      if( api ){ api.hide(); }
    }
  });

  // on typing elements, 
  $body.on('keydown', function(e){
    var escape = 27;
    var $target = $(e.target);

    if( e.which === escape ){
      $target.blur();
    }
  });

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
    if( !graphHasFocus ){ return; } // we shouldn't pan then

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

  // keep track of when the graph has "focus" so we can use that info for
  // enabling and disabling particular shortcuts
  var graphHasFocus = true;
  $body.on('click focus mousedown', function(e){
    var $target = $(e.target);
    var targetIsGraph = false;
    var $parents = $target.parents();

    for( var i = 0; i < $parents.length; i++ ){
      if( $parents[i] === $graph[0] ){
        targetIsGraph = true;
        break;
      }
    }

    graphHasFocus = targetIsGraph;
  });

  Mousetrap.bind('up', function(){ up = true; }, 'keydown');
  Mousetrap.bind('up', function(){ up = false; }, 'keyup');
  Mousetrap.bind('down', function(){ down = true; }, 'keydown');
  Mousetrap.bind('down', function(){ down = false; }, 'keyup');
  Mousetrap.bind('left', function(){ left = true; }, 'keydown');
  Mousetrap.bind('left', function(){ left = false; }, 'keyup');
  Mousetrap.bind('right', function(){ right = true; }, 'keydown');
  Mousetrap.bind('right', function(){ right = false; }, 'keyup');

  // generate `enterkey` events for elements so it can be easily bound to
  $(document).on('keypress', function(e){
    var $target = $(e.target);

    if( e.which === 13 ){
      $target.trigger('enterkey');
    }
  });

});