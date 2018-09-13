const _ = require('lodash');

const icon = (name, cls) => `<span class="cxtmenu-command-icon"><i class="material-icons ${cls}">${name}</i></span>`;

const DEFAULTS = Object.freeze({
  fillColor: 'rgba(0, 0, 0, 0.85)',
  separatorWidth: 8,
  openMenuEvents: 'cxttapstart'
});

module.exports = function({ cy, document, bus }){
  if( !document.editable() ){ return; }

  let drawCmd = {
    content: icon('remove', 'icon-rot-45'),
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
    content: icon('fiber_manual_record'),
    select: function(){
      bus.emit('addelementmouse');
    }
  };

  let drawModeCmd = {
    content: icon('remove', 'icon-rot-45'),
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
