import Popover from './popover';
import React from 'react';
import _ from 'lodash';
import { tippyDefaults } from '../../defs';
import h from 'react-hyperscript';

class Tooltip extends React.Component {
  constructor( props ){
    super( props );
  }

  render(){
    let props = this.props;

    let tippyOptions = _.assign( {}, tippyDefaults, {
      html: (() => {
        return h('div.tooltip-content', [
          h('span.tooltip-description', props.description)
        ].concat(props.shortcut != null ? [
          h('span.tooltip-shortcut-label', 'Keyboard'),
          h('span.tooltip-shortcut', [
            h('code', props.shortcut)
          ])
        ] : []));
      })(),
      placement: 'right',
      trigger: 'mouseenter',
      hideOnClick: true,
      interactive: false,
      touchHold: true,
      theme: 'dark',
      delay: [ 1000, 0 ]
    }, props.tippy );

    let popoverOptions = _.assign( {}, props, { tippy: tippyOptions } );

    return h( Popover, popoverOptions, props.children );
  }
}

module.exports = Tooltip;
