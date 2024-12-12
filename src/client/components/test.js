import h from 'react-hyperscript';
import { Component } from 'react';
import ComboSearch from './combo-search.js';

class Test extends Component {
  constructor(props){
    super(props);
    this.state = {};
  }

  render(){
    return h('div.test', {
      // className: makeClassList({})
    }, [
      h(ComboSearch, {
        placeholder: 'Search for a journal',
        url: '/api/journal/search'
      })
    ]);
  }
}

export default Test;
