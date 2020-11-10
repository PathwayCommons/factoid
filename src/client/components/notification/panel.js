import DataComponent from '../data-component';
import h from 'react-hyperscript';

import InlineNotification from './inline';
import { makeClassList } from '../../dom';

// WIP
class NotificationPanel extends DataComponent {
  constructor( props ){
    super( props );

    this.data = { open: false || props.open };
  }

  componentDidMount(){
    let { notificationList: nl } = this.props;

    this.onChange = () => this.dirty();

    nl.on('change', this.onChange);
  }

  componentWillUnmount(){
    let { notificationList: nl } = this.props;

    nl.removeListener('change', this.onChange);
  }

  open(){
    this.setData({ open: true });
  }

  close(){
    this.setData({ open: false });
  }

  render(){
    let { notificationList: nl } = this.props;
    let { open } = this.data;

    let makeNtfn = notification => h('div.notification-panel-entry', [
      h(InlineNotification, { notification, key: notification.id() })
    ]);

    return (
      h('div.notification-panel', {
        className: makeClassList({ 'notification-panel-open': open })
      }, [
        h('div.notification-panel-entries', Array.from( nl ).map( makeNtfn ))
      ])
    );
  }
}

export default NotificationPanel;
