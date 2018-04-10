const { Component } = require('react');
const h = require('react-hyperscript');

class PageNotFound extends Component {
  constructor(props){
    super(props);
  }

  render(){
    return h('span', 'Page not found'); // TODO
  }
}

module.exports = PageNotFound;
