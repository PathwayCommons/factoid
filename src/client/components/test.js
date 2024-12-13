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
        placeholder: 'Find your journal',
        url: '/api/journal/search',
        displayKey: 'title',
        searchDelay: 100
      })
    ]);
  }
}

export default Test;
