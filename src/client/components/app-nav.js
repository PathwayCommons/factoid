const React = require('react');
const h = require('react-hyperscript');

class AppNav extends React.Component {
  render(){
    return h('div.editor-more-menu', [
      h('div.editor-more-menu-items', this.props.children)
    ]);
  }
}

module.exports = AppNav;
