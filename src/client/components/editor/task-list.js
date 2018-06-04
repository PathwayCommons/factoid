const DirtyComponent = require('../dirty-component');
const h = require('react-hyperscript');

const { makeClassList } = require('../../../util');

const Notification = require('../notification');
const NotificationList = require('../notification/list');
const NotificationPanel = require('../notification/panel');


const eleEvts = [ 'rename', 'complete', 'uncomplete' ];

let bindEleEvts = (ele, cb) => {
  eleEvts.forEach(evt => {

    ele.on(evt, cb);
  });
};

let unbindEleEvts = (ele, cb) => {
  eleEvts.forEach(evt => {
    ele.removeListener(evt, cb);
  });
};

class TaskList extends DirtyComponent {
  shouldComponentUpdate() {
    return true;
  }
  componentDidMount(){
    this.eleEvts = eleEvts;

    let update = () => this.dirty();
    this.update = update;

    this.onAdd = ele => {
      bindEleEvts(ele, update);
      this.dirty();
    };

    this.onRemove = ele => {
      unbindEleEvts(ele, update);
      this.dirty();
    };

    this.props.document.on('add', this.onAdd);
    this.props.document.on('remove', this.onRemove);

    this.props.document.elements().forEach(ele => bindEleEvts(ele, update));
  }

  componentWillUnmount(){
    this.props.document.elements().forEach( ele => unbindEleEvts(ele, this.update));

    this.props.document.removeListener(this.onAdd);
    this.props.document.removeListener(this.onRemove);

  }

  render(){
    let doc = this.props.document;
    let ntfns = doc.entities().concat(doc.interactions()).filter(ele => !ele.completed()).map(ele => {
      let entMsg = ele => `${ele.name() === '' ? 'unnamed entity' : ele.name() + ' (?)'}`;
      let innerMsg = entMsg(ele);

      if( ele.isInteraction() ){
        let participants = ele.participants();
        innerMsg = `the interaction between ${participants.map(entMsg).join(' and ')}`;
      }
      let ntfn = new Notification({
        openable: true,
        dismissable: false,
        openText: 'Show me',
        active: true,
        message: `Provide more information for ${innerMsg}`
      });

      ntfn.on('open', () => this.props.bus.emit('opentip', ele));

      return ntfn;
    });

    let ntfnList = new NotificationList(ntfns);
    let ntfnPanel = h(NotificationPanel, { notificationList: ntfnList });

    let taskListContent = [ntfnPanel];

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
    this.eleEvts = eleEvts;

    let update = () => this.dirty();
    this.update = update;

    this.onAdd = ele => {
      bindEleEvts(ele, update);
      this.dirty();
    };

    this.onRemove = ele => {
      unbindEleEvts(ele, update);
      this.dirty();
    };

    this.props.document.on('add', this.onAdd);
    this.props.document.on('remove', this.onRemove);

    this.props.document.elements().forEach(ele => bindEleEvts(ele, update));
  }

  componentWillUnmount(){
    this.props.document.elements().forEach( ele => unbindEleEvts(ele, this.update));

    this.props.document.removeListener(this.onAdd);
    this.props.document.removeListener(this.onRemove);

  }

  render() {

    let incompleteEles = this.props.document.elements().filter(ele => !ele.completed());
    let numIncompleteEles = incompleteEles.length;

    return h('div', [
      numIncompleteEles !== 0 ? h('div.num-tasks-indicator', numIncompleteEles) : null,
      h('i.material-icons', 'format_list_bulleted')
    ]);
  }
}


module.exports = { TaskListButton, TaskList };