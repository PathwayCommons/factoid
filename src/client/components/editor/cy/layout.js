let on = require('./on-key');
let defs = require('./defs');
let _ = require('lodash');
let { isInteractionNode, getCyLayoutOpts } = require('../../../../util');

let isInteraction = isInteractionNode;

let isNotInteraction = n => !isInteraction( n );

module.exports = function( { bus, cy, document } ){
  let lastLayout;

  let layout = () => {
    if( !document.editable() ){ return; }

    let opts = _.assign( {}, getCyLayoutOpts(), {
      padding: defs.padding
    } );

    if( lastLayout ){
      lastLayout.stop();
    }

    lastLayout = cy.layout( _.assign( {}, opts, {
      animate: 'end',
      animationDuration: defs.layoutAnimationDuration,
      animationEasing: defs.layoutAnimationEasing,
      animationFilter: isNotInteraction
    } ) );

    lastLayout.run();
  };

  on('r', layout);
  bus.on('layout', layout);
};
