let on = require('./on-key');
let defs = require('./defs');
let _ = require('lodash');

let isInteraction = n => n.data('isInteraction');

let isNotInteraction = n => !isInteraction( n );

module.exports = function( { bus, cy, document } ){
  let lastLayout;

  let layout = () => {
    if( !document.editable() ){ return; }

    let opts = {
      name: 'cose-bilkent',
      padding: defs.padding,
      randomize: false,
    };

    if( lastLayout ){
      lastLayout.stop();
    }

    lastLayout = cy.layout( _.assign( {}, opts, {
      animate: 'end',
      animationDuration: defs.layoutAnimationDuration,
      animationEasing: defs.layoutAnimationEasing,
      animationFilter: isNotInteraction
    } ) );

    // hack to remove animations on interactions; not needed in 3.2
    // lastLayout.one('layoutready', function(){
    //   lastLayout.animations.filter( ani => {
    //     let tgt = ani._private.target;
    //
    //     return tgt !== cy && isInteraction( tgt );
    //   } ).forEach( ani => ani.stop() );
    // });

    lastLayout.run();
  };

  on('l', layout);
  bus.on('layout', layout);
};
