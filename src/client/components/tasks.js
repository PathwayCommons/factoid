import _ from 'lodash';
import DataComponent from './data-component';
import h from 'react-hyperscript';
import { Component } from 'react';
import React from 'react';

import Document from '../../model/document';
import { ENTITY_TYPE } from '../../model/element/entity-type';
import { BASE_URL, DEMO_SECRET } from '../../config';
import { makeClassList } from '../dom';
import { NativeShare, isNativeShareSupported } from './native-share';
import { MAX_WAIT_TWEET } from '../../config';

const eleEvts = [ 'rename', 'complete', 'uncomplete', 'associate' ];

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

class TextEditableComponent extends Component {

  constructor( props ) {
    super( props );
    this.textInput = React.createRef();
    this.placeholderText = props.placeholder || '';
    this.defaultValue = props.value || this.placeholderText;
    this.state = {
      editText: this.defaultValue,
      submittedText: this.defaultValue,
      submitted: !!props.value || false
    };
    this.wait = props.autosubmit || 0;
    this.debounceSubmit = _.debounce( this.handleSubmit.bind( this ), this.wait );
  }

  handleChange ( e ) {
    this.setState({
      submitted: false,
      editText: e.target.value
    });
    if( this.props.autosubmit ) this.debounceSubmit();
  }

  handleSubmit () {
    const { editText } = this.state;
    const { cb } = this.props;
    const newValue = editText && editText.trim();
    return new Promise( resolve => {
      this.setState({
        submittedText: newValue,
        submitted: !!newValue
      }, resolve( newValue ) );
    })
    .then( cb )
    .catch( () => {} );
  }

  reset() {
    const { submittedText } = this.state;
    this.setState({
      editText: submittedText
    });
  }

  componentDidMount() {
    const { autofocus } = this.props;
    if( autofocus ){
      this.textInput.current.focus();
      this.textInput.current.select();
    }
  }

  handleKeyDown ( e ) {
    if ( e.key === 'Escape' ) {
      this.reset();
      this.textInput.current.blur();
    } else if ( e.key === 'Enter' ) {
      this.textInput.current.blur();
      this.handleSubmit( e );
    }
  }

  handleBlur () {
    const { editText } = this.state;
    const isPlaceholderText = editText === this.placeholderText;

    if ( !isPlaceholderText || !this.placeholderText ) {
      this.handleSubmit();
    }

    if( this.placeholderText && !editText ){
      this.setState({ editText: this.placeholderText });
    }
  }

  handleFocus ( ) {
    const { editText } = this.state;
    const isPlaceholderText = !!this.placeholderText && editText === this.placeholderText;
    if( isPlaceholderText ){
      this.setState({ editText: '' });
    }
    this.textInput.current.select();
  }

  render() {
    const { label, className } = this.props;
    const { editText, submitted } = this.state;

    return h('div.text-editable', className, [
      h('label', {
        htmlFor: `text-editable-${label}`
      }, [
        label
      ]),
      h('input', {
        type: 'text',
        className: makeClassList({
          'placeholder': editText == this.placeholderText
        }),
        value: editText,
        ref: this.textInput,
        onChange: e => this.handleChange( e ),
        onFocus: e => this.handleFocus( e ),
        onBlur: e => this.handleBlur( e ),
        onKeyDown: e => this.handleKeyDown( e ),
        id: `text-editable-${label}`,
      }),
      h( 'i.material-icons', {
        className: makeClassList({ 'show': submitted })
      }, 'check_circle_outline' )
    ]);
  }
}


export class TaskShare extends Component {
  constructor( props ){
    super( props );
  }

  render(){
    const { document } = this.props;

    if( !isNativeShareSupported() ){
      return null;
    }

    return h('div.task-view-share', [
      h( NativeShare, {
        title: document.citation().title,
        text: '',
        url: BASE_URL + document.publicUrl()
      }, [
        h('i.material-icons', 'share'),
        h('span', ' Share')
      ])
    ]);
  }
}

class TaskView extends DataComponent {
  constructor(props){
    super(props);

    this.state = {
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

    this.props.document.on('add', this.onAdd);
    this.props.document.on('remove', this.onRemove);

    this.props.document.elements().forEach(ele => bindEleEvts(ele, update));
    this.props.bus.on('updatetitle', update);
  }

  tryPublish(){
    const DOCUMENT_STATUS_FIELDS = Document.statusFields();
    const id = this.props.document.id();
    const secret = this.props.document.secret();
    const params = [
      { op: 'replace', path: 'status', value: DOCUMENT_STATUS_FIELDS.PUBLIC }
    ];
    const url = `/api/document/${id}/${secret}`;
    return fetch( url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify( params )
    });
  }

  waitForTweet() {
    let { document } = this.props;
    let start = Date.now();

    return new Promise(resolve => {
      let interval = setInterval(() => {
        let timeElapsed = Date.now() - start;

        if ( document.hasTweet() || timeElapsed >= MAX_WAIT_TWEET ) {
          clearInterval( interval );
          resolve();
        } else {
          // keep trying
        }
      }, 100);
    });
  }

  componentWillUnmount(){
    this.props.document.elements().forEach( ele => unbindEleEvts(ele, this.update));

    this.props.document.removeListener(this.onAdd);
    this.props.document.removeListener(this.onRemove);
    this.props.document.removeListener(this.onSubmit);
    this.props.bus.removeListener('updatetitle', this.update);
  }

  submit(){
    new Promise( resolve => this.setState({ submitting: true }, resolve ) )
      .then( () => this.props.document.submit() )
      .then( () => this.tryPublish() )
      .then( () => this.waitForTweet() )
      .finally( () => {
        new Promise( resolve => this.setState({ submitting: false }, resolve ) );
      });
  }

  render(){
    let { document, bus } = this.props;
    let { submitting } = this.state;
    let done = this.props.controller.done();

    const createTask = ( message, infos ) => {
      return h('div.task-view-list', [
        h('div.task-view-header', message),
        h('div.task-view-items', [
          h('ul', infos.map( ({ msg, ele }) => h('li', [
            h('a.plain-link', {
              onClick: () => bus.emit('opentip', ele)
            }, msg)
          ]) ))
        ])
      ]);
    };

    let incompleteTasks = () => {
      let incompleteEles = this.props.document.elements().filter(ele => {
        return !ele.completed() && !ele.isInteraction() && ele.type() !== ENTITY_TYPE.COMPLEX;
      });

      let taskItemInfos = incompleteEles.map(ele => {
        let entMsg = ele => `${ele.name() === '' ? 'No name provided' : ele.name() + (ele.completed() ? '' : '') }`;
        let innerMsg = entMsg(ele);

        if( ele.isInteraction() ){
          let participants = ele.participants();
          innerMsg = `the interaction between ${participants.map(entMsg).join(' and ')}`;
        }

        return { ele, msg: innerMsg };
      });

      let hasTasks = incompleteEles.length > 0;
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
      let message = tasksMsg();

      return hasTasks ? createTask( message, taskItemInfos ) : null;
    };

    let irregularOrgTasks = () => {
      let tasks = null;
      let taskItemEntities = document.irregularOrganismEntities();
      let numTaskItemEntities = taskItemEntities.length;
      let hasTasks = numTaskItemEntities > 0;


      if ( hasTasks ) {
        let taskMsg = `You added genes from organisms other than ${document.commonOrganism().name()}:`;

        let getTaskInfo = ele => {
          let entMsg = ele => `${ele.name()} [${ele.organism().name()}]`;
          let innerMsg = entMsg(ele);
          return { ele, msg: innerMsg };
        };

        let taskItemInfos = taskItemEntities.map( getTaskInfo );
        tasks = createTask( taskMsg, taskItemInfos );
      }

      return tasks;
    };

    let taskList = () => {
      let tasks = [ irregularOrgTasks(), incompleteTasks() ];
      let hasTasks = tasks.some( task => task != null );
      return hasTasks ? h('div.task-view-task-list', [
        h('div.task-view-task-list-title', 'Could you double-check the following?'),
        ...tasks,
        h('hr')
      ]): null;
    };

    // Minimal criteria: > 0 elements & has title
    let confirm = () => {
      let taskMsg = 'Are you sure you want to submit?';
      let taskButton = h('button.salient-button', {
        disabled: document.trashed(),
        onClick: () => this.submit()
      }, 'Yes, submit');

      const interactions = document.interactions();
      let hasInteraction = interactions.length;
      let hasTitle = _.get(document.citation(), ['title']) != null;

      const close = () => bus.emit('closesubmit');

      if( !hasTitle ){
        taskMsg = `Please set your article's title then submit.`;
        taskButton = h('button.salient-button', {
            onClick: () => {
              bus.emit('showedittitle');
              close();
            }
          }, 'Show me how');
      }

      if( !hasInteraction ){
        taskMsg = 'Please draw an interaction then submit.';
        taskButton = h('button.salient-button', {
            onClick: () => {
              bus.emit('togglehelp');
              close();
            }
          }, 'Show me how');
      }

      return h('div.task-view-confirm', [
        h('div.task-view-confirm-message', [ taskMsg ]),
        h('div.task-view-confirm-button-area', [ taskButton ])
      ]);
    };

     if ( document.secret() === DEMO_SECRET ) {
      return h('div.task-view', "Submit is disabled for demo");

    } else if( !done || submitting ){
      return h('div.task-view', [
        h('i.icon.icon-spinner.task-view-spinner', {
          className: makeClassList({ 'task-view-spinner-shown': submitting })
        }),
        h('div.task-view-submit',{
          className: makeClassList({ 'task-view-submitting': submitting })
        }, [
          taskList(),
          confirm()
        ])
      ]);

    } else {
      const publicUrl =  `${BASE_URL}${document.publicUrl()}`;
      const imageUrl = `${BASE_URL}/api${document.publicUrl()}.png`;

      return h('div.task-view', [
        h('div.task-view-done', [
          h('div.task-view-done-title', 'Thank you!' ),
          h('div.task-view-done-section', [
            h('div.task-view-done-section-body', [
              h('p', 'Your paper is now linked to many others and shared for everyone to explore.'),
              h( 'a.task-view-done-button', { href: publicUrl, target: '_blank', }, 'Explore' )
            ]),
            // h('div.task-view-done-section-footer', [
            //   h('p', `Explore link: ${publicUrl}`)
            // ])
          ]),
          h('hr'),
          h('div.task-view-done-section', [
            h('div.task-view-done-section-body', [
              h('p', 'Good things happen when you share!'),
              h('div.task-view-done-section-body-row', [
                document.hasTweet() ? h('div.task-view-done-section-body-row-item', [
                  h( 'i.icon.icon-t' ),
                  h('a.task-view-done-icon-label', {
                    href: document.tweetUrl(),
                  target: '_blank'
                  },
                  'Tweet'
                  )
                ]) : null,
                h('div.task-view-done-section-body-row-item', [
                  h( 'i.material-icons', 'image' ),
                  h('a.task-view-done-icon-label', {
                    href: imageUrl,
                    download: true
                  },
                  'Download'
                  )
                ])
              ])
            ])
          ])
        ])
      ]);
    }
  }
}


export { TaskView, TextEditableComponent };
