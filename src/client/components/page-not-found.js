import { Component } from 'react';
import h from 'react-hyperscript';

class PageNotFound extends Component {
  constructor(props){
    super(props);
  }

  render(){
    return h('span', 'Page not found'); // TODO
  }
}

export default PageNotFound;
