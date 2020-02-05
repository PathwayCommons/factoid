import DataComponent from './data-component';
import h from 'react-hyperscript';

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


class TaskView extends DataComponent {
  constructor(props){
    super(props);

    this.state = {
      submitted: false
    };
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

    this.onSubmit = () => {
      this.dirty();
    };

    this.props.document.on('add', this.onAdd);
    this.props.document.on('remove', this.onRemove);
    this.props.document.on('submit', this.onSubmit);

    this.props.document.elements().forEach(ele => bindEleEvts(ele, update));
  }

  componentWillUnmount(){
    this.props.document.elements().forEach( ele => unbindEleEvts(ele, this.update));

    this.props.document.removeListener(this.onAdd);
    this.props.document.removeListener(this.onRemove);
    this.props.document.removeListener(this.onSubmit);
  }

  submit(){
    return this.props.document.submit();
  }

  render(){
    let { document, bus } = this.props;
    let submitted = this.props.document.submitted();
    let incompleteEles = this.props.document.elements().filter(ele => {
      return !ele.completed() && !ele.isInteraction();
    });

    let ntfns = document.entities().concat(document.interactions()).filter(ele => !ele.completed()).map(ele => {
      let entMsg = ele => `${ele.name() === '' ? 'unnamed entity' : ele.name() + (ele.completed() ? '' : '') }`;
      let innerMsg = entMsg(ele);

      if( ele.isInteraction() ){
        let participants = ele.participants();
        innerMsg = `the interaction between ${participants.map(entMsg).join(' and ')}`;
      }

      return { ele, msg: innerMsg };
    });

    let tasksMsg = () => {
      let numIncompleteEles = incompleteEles.length > 50 ? '50+' : incompleteEles.length;
      if( numIncompleteEles === 0 ){
        return `You have no outstanding tasks left`;
      }

      if( numIncompleteEles === 1 ){
        return `You have 1 incomplete item:`;
      }

      return `You have ${numIncompleteEles} incomplete items:`;
    };

    if( !submitted ){
      return h('div.task-view', [
        incompleteEles.length > 0 ? h('div.task-view-header', tasksMsg()) : null,
        incompleteEles.length > 0 ? h('div.task-view-items', [
          h('ul', ntfns.map( ({ msg, ele }) => h('li', [
            h('a.plain-link', {
              onClick: () => bus.emit('opentip', ele)
            }, msg)
          ]) ))
        ]) : null,
        h('div.task-view-confirm', 'Are you sure you want to submit?'),
        h('div.task-view-confirm-button-area', [
          h('button.salient-button.task-view-confirm-button', { onClick: () => this.submit() }, 'Yes, submit')
        ])
      ]);
    } else {
      return h('div.task-view', [
        h('div.task-view-done', [
          h('div.task-view-done-message', 'Your figure has been submitted, and you will be contacted shortly regarding its publication status.')
        ])
      ]);
    }
  }
}


export { TaskView };
