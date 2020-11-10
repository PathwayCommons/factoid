import DirtyComponent from '../dirty-component';
import h from 'react-hyperscript';
import { makeClassList } from '../../dom';

/**
 * A base component for notifications.  A concrete component should contain a NotifcationBase.
 */
class NotificationBase extends DirtyComponent {
  constructor( props ){
    super( props );
  }

  componentDidMount(){
    let { notification: ntfn } = this.props;

    this.onChange = () => this.dirty();

    ntfn.on('change', this.onChange);
  }

  componentWillUnmount(){
    let { notification: ntfn } = this.props;

    ntfn.removeListener('change', this.onChange);
  }

  render(){
    let p = this.props;
    let n = p.notification;

    return ( h('div.notification', {
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
        n.options.dismissable ? h('button.notification-action.notification-dismiss', { onClick: () => n.dismiss() }, [
          'Dismiss'
        ]) : null,
        h('button.notification-action.notification-open', { onClick: () => n.open() }, n.openText())
      ])
    ]) );
  }
}

export default props => h(NotificationBase, Object.assign({ key: props.notification.id() }, props));
