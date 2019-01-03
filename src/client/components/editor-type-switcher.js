const { Component } = require('react');
const Tooltip = require('./popover/tooltip');
const { Link } = require('react-router-dom');
const h = require('react-hyperscript');

class EditorTypeSwitcher extends Component {
  constructor( props ){
    super( props );
  }

  render(){
    let { networkEditor, document } = this.props;

    let id = document.id();
    let secret = document.secret();
    let description = networkEditor ? 'Form Editor' : 'Network Editor';
    let url = `/${networkEditor ? 'form' : 'document'}/${id}/${secret}`;

    return h(Tooltip, { description, tippy: { placement: 'bottom' } }, [
      h('div.editor-type-switcher', [
        h(Link, { to: url }, [
          h('i.material-icons', 'swap_horiz')
        ])
      ])
    ]);
  }
}

module.exports = EditorTypeSwitcher;
