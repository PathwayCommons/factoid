const React = require('react');
const DirtyComponent = require('../dirty-component');
const h = require('react-hyperscript');
const _ = require('lodash');

const { makeClassList } = require('../../../util');
const defs = require('../../defs');

const NotificationPanel = require('../notification/panel');


class TaskList extends React.Component {
  constructor(props){
    super(props);

    this.data = ({
      showNotificationList: false
    });

    this.state = _.assign({}, this.data);

    let toggleSideBar = () => this.toggleSideBar();
    this.toggleSideBarHandler = toggleSideBar;
    props.bus.on('toggletasklist', this.toggleSideBarHandler);
  }

  setData( obj, callback ){
    _.assign( this.data, obj );

    this.setState( obj, callback );
  }

  render(){
    let taskListContent = [
      h('div.task-list-content')
    ];


    return h('div.task-list', taskListContent);
  }
}


class TaskListButton extends DirtyComponent {
  constructor(props){
    super(props);
  }

  shouldComponentUpdate() {
    return true;
  }

  componentDidMount(){
    this.onAdd = () => this.dirty();
    this.onRemove = () => this.dirty();
    this.props.document.on('add', this.onAdd);
    this.props.document.on('remove', this.onRemove);
  }

  componentWillUnmount(){
    this.props.document.removeListener(this.onAdd);
    this.props.document.removeListener(this.onRemove);
  }

  render() {

    let incompleteEnts = this.props.document.entities().filter(ent => !ent.completed());
    let numIncompleteEntities = incompleteEnts.length;

    // let notifications = incompleteEnts.map(e => new Notification({
    //   title: 'complete this entity',
    //   message: 'entity'
    // }));

    return h('button.editor-button.plain-button.task-list-button', { onClick: () => this.props.bus.emit('toggletasklist') }, [
      numIncompleteEntities !== 0 ? h('div.num-tasks-indicator', this.props.document.entities().filter(ent => !ent.completed()).length) : null,
      h('i.material-icons', 'format_list_bulleted'),
      // h(NotificationPanel, { notification: { id: 1 }, notificationList: [], show: true })
    ]);
  }
}


module.exports = { TaskListButton, TaskList };