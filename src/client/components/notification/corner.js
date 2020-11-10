import DirtyComponent from '../dirty-component';
import h from 'react-hyperscript';
import NotificationBase from './base';
import { makeClassList } from '../../dom';

class CornerNotification extends DirtyComponent {
  constructor(props){
    super(props);
  }

  componentDidMount(){
    let { notification: ntfn } = this.props;

    this.onActivationChange = () => this.dirty();

    ntfn.on('activate', this.onActivationChange);
    ntfn.on('deactivate', this.onActivationChange);
  }

  componentWillUnmount(){
    let { notification: ntfn } = this.props;

    ntfn.removeListener('activate', this.onActivationChange);
    ntfn.removeListener('deactivate', this.onActivationChange);
  }

  render(){
    let { notification, className } = this.props;

    return ( h('div.corner-notification', {
      className: makeClassList({
        'corner-notification-active': notification.active()
      }) + ' ' + className
    }, [
      h(NotificationBase, { notification })
    ]) );
  }
}

export default props => h(CornerNotification, Object.assign({ key: props.notification.id() }, props));
