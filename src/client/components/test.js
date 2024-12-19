import h from 'react-hyperscript';
import { Component } from 'react';
import ComboSearch from './combo-search.js';

class Test extends Component {
  constructor(props){
    super(props);
    this.state = {
      value: ''
    };
  }

  setValue ( value ) {
    this.setState({ value });
  }

  handleSubmit (e) {
    e.preventDefault();
    alert(`You selected: ${this.state.value.title}`);
  }

  render(){
    const { value } = this.state;

    return h('div.test', {
    }, [
      h('h1', 'ComboBox Demo'),
      h('div.selection', [
        h('h3', 'alue'),
        value ? h('ul', [
          h('li', `title: ${value.title}`),
          h('li', `publisher: ${value.publisher}`),
          h('li', `issn: ${value.issn.join(', ')}`),
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
          setValue: this.setValue.bind(this)
        }),
        h('button', {
          type: 'submit'
        }, 'Submit')
      ])
    ]);
  }
}

export default Test;
