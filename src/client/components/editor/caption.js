import h from 'react-hyperscript';
import { Component } from 'react';
// import _ from 'lodash';
import TextareaAutosize from 'react-autosize-textarea';
import { makeClassList } from '../../dom';

export class Caption extends Component {
  constructor(props){
    super(props);

    this.state = ({ caption: props.document.caption() });
  }

  render(){
    const { document } = this.props;

    return h('div.editor-caption', [
      document.editable() ?
        h(TextareaAutosize, {
          className: makeClassList({
            'editor-caption-textarea': true
          }),
          value: this.state.caption,
          placeholder: `List terms that identify the context (e.g. T cell, cancer, genome stability)`,
          onChange: event => {
            const val = event.target.value;

            this.setState({ caption: val });

            document.caption(val);
          }
        }) :
        h('div.editor-caption-text', document.caption())
    ]);
  }
}

export default Caption;