const { Component } = require('react');
const h = require('react-hyperscript');
const EventEmitter = require('eventemitter3');
const Tooltip = require('./popover/tooltip');
const { Link } = require('react-router-dom');

class MainMenu extends Component {
  constructor(props){
    super(props);

    this.emitter = new EventEmitter();
  }

  render(){
    let { title } = this.props;

    return h('div.main-menu', [
      h(Tooltip, { description: 'Home', tippy: { placement: 'bottom' } }, [
        h('div.main-menu-logo', [
          h(Link, { to: '/' }, [
            h('i.icon.icon-logo')
          ])
        ])
      ]),

      title ? h('h1.main-menu-title', title) : null
    ]);

  }
}

module.exports = MainMenu;