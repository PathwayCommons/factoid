import h from 'react-hyperscript';
import { Component } from 'react';
import ComboSearch from './combo-search.js';

class Test extends Component {
  constructor(props){
    super(props);
    this.state = {
      selection: ''
    };
  }

  setSelection (selection) {
    this.setState({ selection });
  }

  handleSubmit (e) {
    e.preventDefault();
    alert(`You selected: ${this.state.selection.title}`);
  }

  render(){
    const { selection } = this.state;

    return h('div.test', {
    }, [
      h('h1', 'ComboBox Demo'),
      h('div.selection', [
        h('h3', 'Selection'),
        selection ? h('ul', [
          h('li', `title: ${selection.title}`),
          h('li', `publisher: ${selection.publisher}`),
          h('li', `issn: ${selection.issn.join(', ')}`),
        ]) : null
      ]),
      h('form', {
        onSubmit: e => this.handleSubmit(e)
      }, [
        h(ComboSearch, {
          placeholder: 'Select your journal',
          url: '/api/journal/search',
          queryKey: 'title',
          delay: 100,
          setValue: this.setSelection.bind(this)
        }),
        h('button', {
          type: 'submit'
        }, 'Submit')
      ])
    ]);
  }
}

export default Test;
