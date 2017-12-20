const Popover = require('./popover');
const React = require('react');
const _ = require('lodash');
const { tippyDefaults } = require('../defs');
const h = require('react-hyperscript');

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
      trigger: 'mouseenter click',
      hideOnClick: true,
      interactive: false,
      touchHold: true,
      theme: 'dark',
      delay: [ 500, 0 ]
    }, props.tippy );

    let popoverOptions = _.assign( {}, props, { tippy: tippyOptions } );

    return h( Popover, popoverOptions, props.children );
  }
}

module.exports = Tooltip;
