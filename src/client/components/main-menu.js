const { Component } = require('react');
const h = require('react-hyperscript');
const _ = require('lodash');
const Popover = require('./popover/popover');
const Linkout = require('./document-linkout');
const { exportDocumentToOwl } = require('../client-util');
const EventEmitter = require('eventemitter3');
const Tooltip = require('./popover/tooltip');
const { Link } = require('react-router-dom');

class MenuContent extends Component {
  constructor(props){
    super(props);

    this.state = {
      selectedLinkouts: false
    };

    this.onHide = () => {
      this.setState({ selectedLinkouts: false });
    };

    this.props.emitter.on('hide', this.onHide);
  }

  componentWillUnmount(){
    this.props.emitter.removeListener('hide', this.onHide);
  }

  selectLinkouts(){
    this.setState({ selectedLinkouts: true });
  }

  render(){
    const { bus, document, history, emitter } = this.props;
    const { selectedLinkouts } = this.state;

    const set = (props, children) => h('div.main-menu-set', props, children);

    const close = () => emitter.emit('close');

    const item = ({ label, action, actionCloses = true }) => h('button.main-menu-item.plain-button', {
      onClick: e => {
        action(e);

        if( actionCloses ){ close(); }
      }
    }, [
      h('span', label)
    ]);

    let content;

    if( selectedLinkouts ){
      content = h('div.main-menu-linkouts', [
        h(Linkout, { document })
      ]);
    } else {
      content = h('div.main-menu-list', [
        set({ key: 'util' }, [
          item({ label: 'Help', action: () => _.debounce(() => bus.emit('togglehelp'), 300) }),
          item({ label: 'Share', action: () => this.selectLinkouts(), actionCloses: false })
        ]),
        set({ key: 'dl' }, [
          item({ label: 'Download BioPAX', action: () => exportDocumentToOwl(document.id()) })
        ]),
        set({ key: 'nav' }, [
          item({ label: 'New factoid', action: () => history.push('/new') }),
          item({ label: 'My factoids', action: () => history.push('/documents') })
        ])
      ]);
    }

    return h('div.main-menu-content', [ content ]);
  }
}

class MainMenu extends Component {
  constructor(props){
    super(props);

    this.emitter = new EventEmitter();
  }

  render(){
    let { emitter } = this;
    let { bus, document, history } = this.props;

    return h('div.main-menu', [
      h(Popover, {
        hide: hideNow => emitter.on('close', hideNow),
        tippy: {
          onHide: () => emitter.emit('hide'),
          onShow: () => emitter.emit('show'),
          placement: 'bottom',
          html: h(MenuContent, { bus, document, history, emitter })
        }
      }, [
        h(Tooltip, { description: 'Menu', tippy: { placement: 'bottom' } }, [
          h('button.main-menu-button.plain-button', [
            h('i.material-icons', 'more_vert')
          ])
        ])
      ]),

      h(Tooltip, { description: 'Home', tippy: { placement: 'bottom' } }, [
        h('div.main-menu-logo', [
          h(Link, { to: '/' }, [
            h('i.icon.icon-logo')
          ])
        ])
      ])
    ]);

  }
}

module.exports = MainMenu;