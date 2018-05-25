const DirtyComponent = require('../dirty-component');
const h = require('react-hyperscript');
const NotificationBase = require('./base');
const { makeClassList } = require('../../../util');

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

module.exports = props => h(CornerNotification, Object.assign({ key: props.notification.id() }, props));
