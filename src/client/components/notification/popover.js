const { Component } = require('react');
const NotificationBase = require('./base');
const Popover = require('../popover');
const _ = require('lodash');
const { tippyDefaults } = require('../../defs');
const h = require('react-hyperscript');

class PopoverNotification extends Component {
  constructor( props ){
    super( props );

    let { notification, tippy } = this.props;

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
        let show = this.show = () => {
          if( this.data.mounted ){
            showNow();
          }
        };

        notification.on('activate', show);

        if( notification.active() ){
          show();
        }
      },
      hide: hideNow => {
        let hide = this.hide = () => {
          if( this.data.mounted ){
            hideNow();
          }
        };

        notification.on('deactivate', hide);
        notification.on('dismiss', hide);
      }
    } );

    this.popoverOptions = popoverOptions;
  }

  componentDidMount(){
    this.data.mounted = true;
  }

  componentWillUnmount(){
    let { notification } = this.data;
    let { show, hide } = this;

    this.data.mounted = false;

    notification.removeListener('activate', show);
    notification.removeListener('deactivate', hide);
    notification.removeListener('dismiss', hide);
  }

  render(){
    return h( Popover, this.popoverOptions, this.props.children );
  }
}

module.exports = PopoverNotification;
