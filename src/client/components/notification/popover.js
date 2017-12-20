const { Component } = require('react');
const NotificationBase = require('./base');
const Popover = require('../popover');
const _ = require('lodash');
const { tippyDefaults } = require('../../defs');
const h = require('react-hyperscript');

class PopoverNotification extends Component {
  constructor( props ){
    super( props );
  }

  render(){
    let { notification, tippy, children } = this.props;

    let tippyOptions = _.assign( {}, tippyDefaults, {
      html: (() => {
        return h('div.popover-notification-content', [
          h(NotificationBase, { notification })
        ]);
      })(),
      placement: 'top',
      trigger: 'manual',
      hideOnClick: false,
      interactive: true,
      touchHold: false,
      theme: 'dark',
      delay: 0
    }, tippy );

    let popoverOptions = _.assign( {}, this.props, {
      tippy: tippyOptions,
      show: showNow => {
        notification.on('activate', showNow);

        if( notification.active() ){
          showNow();
        }
      },
      hide: hideNow => {
        notification.on('deactivate', hideNow);
        notification.on('dismiss', hideNow);
      }
    } );

    return h( Popover, popoverOptions, children );
  }
}

module.exports = PopoverNotification;
