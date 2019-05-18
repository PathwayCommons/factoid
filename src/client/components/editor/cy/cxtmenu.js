import _ from 'lodash';

const matIcon = (name, cls) => `<span class="cxtmenu-command-icon"><i class="material-icons ${cls}">${name}</i></span>`;
const customIcon = (name, cls) => `<span class="cxtmenu-command-icon"><i class="icon icon-white ${name} ${cls}"></i></span>`;

const DEFAULTS = Object.freeze({
  fillColor: 'rgba(0, 0, 0, 0.85)',
  separatorWidth: 8,
  openMenuEvents: 'cxttapstart'
});

import { PARTICIPANT_TYPE } from '../../../../model/element/participant-type';

export default function({ cy, document, bus }){
  if( !document.editable() ){ return; }

  let drawUnsignedCmd = {
    content: customIcon('icon-arrow-unsigned', 'icon-rot-345'),
    select: function( el ){
      bus.emit( 'drawfrom', el, PARTICIPANT_TYPE.UNSIGNED );
    }
  };

  let drawPositiveCmd = {
    content: customIcon('icon-arrow-positive', 'icon-rot-345'),
    select: function( el ){
      bus.emit( 'drawfrom', el, PARTICIPANT_TYPE.POSITIVE );
    }
  };

  let drawNegativeCmd = {
    content: customIcon('icon-arrow-negative', 'icon-rot-345'),
    select: function( el ){
      bus.emit( 'drawfrom', el, PARTICIPANT_TYPE.NEGATIVE );
    }
  };

  let rmElCmd = {
    content: matIcon('clear'),
    select: function( el ){
      bus.emit('removebycy', el);
    }
  };

  let rmSelCmd = {
    content: matIcon('clear'),
    select: function(){
      bus.emit('removeselected');
    }
  };

  let addEntCmd = {
    content: matIcon('fiber_manual_record'),
    select: function(){
      bus.emit('addelementmouse');
    }
  };

  cy.cxtmenu( _.assign( {}, DEFAULTS, {
    selector: 'node[?isEntity]',
    commands: [ drawUnsignedCmd, drawPositiveCmd, drawNegativeCmd, rmElCmd ]
  } ) );

  cy.cxtmenu( _.assign( {}, DEFAULTS, {
    selector: 'edge',
    commands: [ rmElCmd ]
  } ) );

  let bgCmds = [ addEntCmd, rmSelCmd ];

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
