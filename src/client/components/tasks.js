import _ from 'lodash';
import DataComponent from './data-component';
import h from 'react-hyperscript';

import { BASE_URL } from '../../config';
import Document from '../../model/document';

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
      const DOCUMENT_STATUS_FIELDS = Document.statusFields();
      const id = this.props.document.id();
      const secret = this.props.document.secret();
      const params = [
        { op: 'replace', path: 'status', value: DOCUMENT_STATUS_FIELDS.PUBLISHED }
      ];
      const url = `/api/document/status/${id}/${secret}`;
      return fetch( url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify( params )
      });
    };

    this.onUpdate = change => {
      if( _.has( change, 'status' ) ){
        if( change.status === 'submitted' ) this.onSubmit();
        this.dirty();
      }
    };

    this.props.document.on('add', this.onAdd);
    this.props.document.on('remove', this.onRemove);
    this.props.document.on('update', this.onUpdate);

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
    let done = document.submitted() || document.published();
    let incompleteEles = this.props.document.elements().filter(ele => {
      return !ele.completed() && !ele.isInteraction();
    });

    let ntfns = document.entities().filter(ele => !ele.completed()).map(ele => {
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

    if( !done ){
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
          h('button.salient-button.task-view-confirm-button', {
            disabled: document.trashed(),
            onClick: () => this.submit()
          }, 'Yes, submit')
        ])
      ]);
    } else {
      return h('div.task-view.done', [
        h('div.task-view-done', [
          h('div.task-view-done-symbol', [
            h('i.material-icons', 'check_circle_outline' ),
          ]),
          h('div.task-view-done-caption', [
            h('h1.task-view-done-caption-title', 'Success!' ),
            h('p.task-view-done-caption-body', 'Check for a confirmation email' ),
            h('p.task-view-done-caption-footer', [
              h('a.plain-link', {
                target: '_blank',
                href: BASE_URL
              },'Contribute another' )
            ])
          ])
        ])
      ]);
    }
  }
}


export { TaskView };
