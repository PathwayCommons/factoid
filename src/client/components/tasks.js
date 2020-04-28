import _ from 'lodash';
import DataComponent from './data-component';
import h from 'react-hyperscript';

import Document from '../../model/document';
import { ENTITY_TYPE } from '../../model/element/entity-type';
import { BASE_URL } from '../../config';
import { makeClassList } from '../../util';

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
      done: false,
      submitting: false
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
        if( change.status === 'submitted' ){
          this.onSubmit()
            .finally( () => {
              new Promise( resolve => this.setState({ done: true, submitting: false }, resolve ) )
              .then( () => this.props.onDone( true ) )
              .then( () => this.dirty() );
            });
        }
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
    new Promise( resolve => this.setState({ submitting: true }, resolve ) )
      .then( () => this.props.document.submit() );
  }

  render(){
    let { document, bus } = this.props;
    let { done, submitting } = this.state;
    let incompleteEles = this.props.document.elements().filter(ele => {
      return !ele.completed() && !ele.isInteraction() && ele.type() !== ENTITY_TYPE.COMPLEX;
    });

    let ntfns = incompleteEles.map(ele => {
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
        h('i.icon.icon-spinner.task-view-spinner', {
          className: makeClassList({ 'task-view-spinner-shown': submitting })
        }),
        h('div.task-view-submit',{
          className: makeClassList({ 'task-view-submitting': submitting })
        }, [
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
        ])
      ]);
    } else {
      const {
        title = 'Untitled',
        reference = ''
      } = document.citation();
      const citation = _.compact([title, reference]).join(' ');
      const publicUrl =  `${BASE_URL}${document.publicUrl()}`;
      const imageUrl = `${BASE_URL}/api${document.publicUrl()}.png`;
      return h('div.task-view', [
        h('div.task-view-done', [
          h('h1.task-view-done-title', 'Thank you!' ),
          h('div.task-view-done-section', [
            h('div.task-view-done-section-body', [
              h('p', 'Your information is now integrated with a larger body of knowledge that all researchers are free to explore'),
              h( 'a.task-view-done-button', { href: document.publicUrl(), target: '_blank', }, 'Start Explore' )
            ])
          ]),
          h('hr'),
          h('div.task-view-done-section', [
            h('div.task-view-done-section-body', [
              h('p', 'Good things happen when you share!'),
            ]),

            h('ul.task-view-done-section-list', [
              document.hasTweet() ? h('li', [
                h( 'i.icon.icon-t' ),
                h('a.plain-link', {
                  href: document.tweetUrl(),
                target: '_blank'
                },
                ' See Tweet @biofactoid'
                )
              ]) : null,
              h('li', [
                h( 'i.material-icons', 'image' ),
                h('a.plain-link', {
                  href: imageUrl,
                  target: '_blank'
                },
                ' Get image'
                )
              ]),
              h('li', [
                h( 'i.material-icons', 'email' ),
                h('a.plain-link', {
                  href: `mailto:?subject=Pathway data for ${citation} on Biofactoid&body=We have published pathway data for our article ${citation} on Biofactoid ${publicUrl}.`,
                  target: '_blank'
                },
                ' Email link'
                )
              ])
            ])
          ])
        ])
      ]);
    }
  }
}


export { TaskView };
