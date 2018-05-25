const DataComponent = require('../data-component');
const h = require('react-hyperscript');
const NotificationBase = require('./base');
const { makeClassList } = require('../../../util');

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

    let makeNtfn = notification => h(NotificationBase, { notification, key: notification.id() });

    return (
      h('div.notification-panel', {
        className: makeClassList({ 'notification-panel-open': open })
      }, [
        h('div.notification-panel-entries', Array.from( nl ).map( makeNtfn ))
      ])
    );
  }
}

module.exports = NotificationPanel;

