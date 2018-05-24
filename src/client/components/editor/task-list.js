const React = require('react');
const DirtyComponent = require('../dirty-component');
const h = require('react-hyperscript');

const { makeClassList } = require('../../../util');


const getIncompleteEntities = doc => doc.entities().filter(ent => !ent.completed());

class TaskList extends React.Component {
  render(){
    let taskListContent = [
      h('div.task-list-content', getIncompleteEntities(this.props.document).map(ent => {
        return h('div', `complete ${ent.name() === '' ? 'unamed entitiy' : ent.name()}`);
      }))
    ];

    return h('div.task-list', {
      className: makeClassList({ 'task-list-active': this.props.show })
    }, taskListContent);
  }
}


class TaskListButton extends DirtyComponent {
  constructor(props){
    super(props);
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

    let incompleteEnts = getIncompleteEntities(this.props.document);
    let numIncompleteEntities = incompleteEnts.length;

    return h('div', [
      numIncompleteEntities !== 0 ? h('div.num-tasks-indicator', incompleteEnts.length) : null,
      h('i.material-icons', 'format_list_bulleted')
    ]);
  }
}


module.exports = { TaskListButton, TaskList };