const _ = require('lodash');

const icon = name => '<span class="cxtmenu-command-icon"><i class="material-icons">' + name + '</i></span>';

const DEFAULTS = Object.freeze({
  fillColor: 'rgba(0, 0, 0, 0.85)',
  separatorWidth: 8,
  openMenuEvents: 'cxttapstart'
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

  let drawModeCmd = {
    content: icon('keyboard_tab'),
    select: function(){
      bus.emit('drawtoggle');
    }
  };

  cy.cxtmenu( _.assign( {}, DEFAULTS, {
    selector: 'node[?isInteraction]',
    commands: [ drawCmd, rmElCmd ]
  } ) );

  cy.cxtmenu( _.assign( {}, DEFAULTS, {
    selector: 'node[?isEntity]',
    commands: [ drawCmd, rmElCmd ]
  } ) );

  cy.cxtmenu( _.assign( {}, DEFAULTS, {
    selector: 'edge',
    commands: [ rmElCmd ]
  } ) );

  let bgCmds = [ drawModeCmd, addEntCmd, rmSelCmd ];

  cy.cxtmenu( _.assign( {}, DEFAULTS, {
    selector: 'core',
    commands: bgCmds
  } ) );

  cy.on('cxttapstart', 'node, edge', function( evt ){
    let el = evt.target;

    el.addClass('cxtmenu-tgt');

    bus.emit('closetip');
  });

  cy.on('cxttapend tapend', 'node, edge', function( evt ){
    let el = evt.target;

    el.removeClass('cxtmenu-tgt');
  });
};
