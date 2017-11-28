const DirtyComponent = require('../dirty-component');
const h = require('react-hyperscript');
const { makeClassList } = require('../../../util');

/**
 * A base component for notifications.  A concrete component should contain a NotifcationBase.
 */
class NotificationBase extends DirtyComponent {
  constructor( props ){
    super( props );

    let { notification: ntfn } = props;

    ntfn.on('change', () => this.dirty());
  }

  render(){
    let p = this.props;
    let n = p.notification;

    return super.render( h('div.notification', {
      className: makeClassList({
        'notification-active': n.active(),
        'notification-inactive': !n.active(),
        'notification-dismissed': n.dismissed(),
        'notification-openable': n.openable()
      }) + ( p.className ? ' ' + p.className : '' )
    }, [
      h('div.notification-content', {
        onClick: () => {
          if( n.openable() ){ n.open(); }
        }
      }, [
        n.title() ? h('div.notification-title', n.title()) : null,
        h('div.notification-message', n.message())
      ].filter( v => v != null )),
      h('div.notification-actions', [
        h('button.notification-action.notification-dismiss', { onClick: () => n.dismiss() }, [
          h('i.material-icons.notification-dismiss-icon', 'close')
        ]),
        h('button.notification-action.notification-open', { onClick: () => n.open() }, n.openText())
      ])
    ]) );
  }
}

module.exports = NotificationBase;
