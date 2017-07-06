const _ = require('lodash');

const icon = name => '<span class="cxtmenu-command-icon"><i class="material-icons">' + name + '</i></span>';

const DEFAULTS = Object.freeze({
  fillColor: 'rgba(0, 0, 0, 0.85)',
  separatorWidth: 8
});

module.exports = function({ cy, document, bus }){
  if( !document.editable() ){ return; }

  let drawCmd = {
    content: icon('keyboard_tab'),
    select: function( el ){
      bus.emit( 'drawfrom', el );
    }
  };

  let rmElCmd = {
    content: icon('clear'),
    select: function( el ){
      bus.emit('removebycy', el);
    }
  };

  let rmSelCmd = {
    content: icon('clear'),
    select: function(){
      bus.emit('removeselected');
    }
  };

  let addEntCmd = {
    content: icon('add_circle'),
    select: function(){
      bus.emit('addelementmouse');
    }
  };

  let addIntnCmd = {
    content: icon('add_box'),
    select: function(){
      bus.emit('addinteractionmouse');
    }
  };

  let drawModeCmd = {
    content: icon('keyboard_tab'),
    select: function(){
      bus.emit('drawtoggle');
    }
  };

  let layoutCmd = {
    content: icon('shuffle'),
    select: function(){
      bus.emit('layout');
    }
  };

  let fitCmd = {
    content: icon('zoom_out_map'),
    select: function(){
      bus.emit('fit');
    }
  };

  cy.cxtmenu( _.assign( {}, DEFAULTS, {
    selector: 'node',
    commands: [ drawCmd, rmElCmd ]
  } ) );

  cy.cxtmenu( _.assign( {}, DEFAULTS, {
    selector: 'edge',
    commands: [ rmElCmd ]
  } ) );

  cy.cxtmenu( _.assign( {}, DEFAULTS, {
    selector: 'core',
    openMenuEvents: 'cxttapstart',
    commands: [ addEntCmd, drawModeCmd, layoutCmd, fitCmd, rmSelCmd, addIntnCmd ]
  } ) );

  cy.on('cxttapstart taphold', 'node, edge', function( evt ){
    let el = evt.target;

    el.addClass('cxtmenu-tgt');
  });

  cy.on('cxttapend tapend', 'node, edge', function( evt ){
    let el = evt.target;

    el.removeClass('cxtmenu-tgt');
  });
};
