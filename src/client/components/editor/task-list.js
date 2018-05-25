const DirtyComponent = require('../dirty-component');
const h = require('react-hyperscript');

const { makeClassList } = require('../../../util');

const Notification = require('../notification');
const NotificationList = require('../notification/list');
const NotificationPanel = require('../notification/panel');

const getIncompleteEntities = doc => doc.entities().filter(ent => !ent.completed());


const eleEvts = [ 'rename', 'redescribe' ];
const entEvts = [ 'modify', 'associated', 'unassociated', 'complete', 'uncomplete'];
const intnEvts = [ 'retype' ];

let bindEleEvts = (ele, cb) => {
  eleEvts.forEach(evt => {

    ele.on(evt, cb);
  });

  if( ele.isInteraction() ){
    intnEvts.forEach(evt => {
      ele.on(evt, cb);
    });
  } else {
    entEvts.forEach(evt => {
      ele.on(evt, cb);
    });
  }
};

let unbindEleEvts = (ele, cb) => {
  eleEvts.forEach(evt => {
    ele.removeListener(evt, cb);
  });

  if( ele.isInteraction() ){
    intnEvts.forEach(evt => {
      ele.removeListener(evt, cb);
    });
  } else {
    entEvts.forEach(evt => {
      ele.removeListener(evt, cb);
    });
  }
};

class TaskList extends DirtyComponent {
  shouldComponentUpdate() {
    return true;
  }
  componentDidMount(){
    this.eleEvts = eleEvts;
    this.entEvts = entEvts;
    this.intnEvts = intnEvts;

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
    let ntfns = doc.entities().filter(ent => !ent.completed()).map(ent => {
      let ntfn = new Notification({
        openable: true,
        openText: 'Show me',
        active: true,
        message: `Provide more information for incomplete entity ${ent.name() === '' ? 'unnamed entity' : ent.name()}.`
      });

      ntfn.on('open', () => this.props.bus.emit('opentip', ent));

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
    this.entEvts = entEvts;
    this.intnEvts = intnEvts;

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

    let incompleteEnts = getIncompleteEntities(this.props.document);
    let numIncompleteEntities = incompleteEnts.length;

    return h('div', [
      numIncompleteEntities !== 0 ? h('div.num-tasks-indicator', incompleteEnts.length) : null,
      h('i.material-icons', 'format_list_bulleted')
    ]);
  }
}


module.exports = { TaskListButton, TaskList };