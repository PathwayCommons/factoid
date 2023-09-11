// import on from './on-key';
import * as defs from './defs';
import _ from 'lodash';
import { isInteractionNode, getCyLayoutOpts } from '../../../../util';

let isInteraction = isInteractionNode;

let isNotInteraction = n => !isInteraction( n );

export default function( { bus, cy, document } ){
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

  // on('r', layout);
  bus.on('layout', layout);
}
