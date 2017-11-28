const DirtyComponent = require('../dirty-component');
const h = require('react-hyperscript');
const NotificationBase = require('./base');
const { makeClassList } = require('../../../util');

// WIP
class NotificationPanel extends DirtyComponent {
  constructor( props ){
    super( props );

    this.state = { open: false || props.open };

    let { notificationList: nl } = props;

    nl.on('change', () => this.dirty());
  }

  open(){
    this.setState({ open: true });
  }

  close(){
    this.setState({ open: false });
  }

  render(){
    let { notificationList: nl } = this.props;
    let { open } = this.state;

    let makeNtfn = notification => h(NotificationBase, { notification });

    return super.render(
      h('div.notification-panel', {
        className: makeClassList({ 'notification-panel-open': open })
      }, [
        h('div.notification-panel-entries', Array.from( nl ).map( makeNtfn ))
      ])
    );
  }
}

module.exports = NotificationPanel;
