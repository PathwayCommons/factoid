const { Component } = require('react');
const h = require('react-hyperscript');
const _ = require('lodash');
const Popover = require('./popover/popover');
const Linkout = require('./document-linkout');
const { exportDocumentToBiopax, exportDocumentToTxt, exportDocumentToSbgn } = require('../client-util');
const EventEmitter = require('eventemitter3');
const Tooltip = require('./popover/tooltip');
const { Link } = require('react-router-dom');
const MyFactoids = require('./my-factoids');

class MenuContent extends Component {
  constructor(props){
    super(props);

    this.state = {
      selectedLinkouts: false,
      selectedMyFactoids: false
    };

    this.onHide = () => {
      this.setState({ selectedLinkouts: false, selectedMyFactoids: false });
    };

    this.props.emitter.on('hide', this.onHide);
  }

  componentWillUnmount(){
    this.props.emitter.removeListener('hide', this.onHide);
  }

  selectLinkouts(){
    this.setState({ selectedLinkouts: true });
  }

  selectMyFactoids(){
    this.setState({ selectedMyFactoids: true });
  }

  render(){
    const { bus, document, history, emitter, networkEditor } = this.props;
    const { selectedLinkouts, selectedMyFactoids } = this.state;

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
    } else if( selectedMyFactoids ){
      content = h('div.main-menu-my-factoids', [
        h(MyFactoids)
      ]);
    } else {
      content = h('div.main-menu-list', [
        document ? set({ key: 'util' }, [
          item({ label: 'Help', action: () => _.debounce(() => bus.emit('togglehelp'), 300) }),
          item({ label: 'Share', action: () => this.selectLinkouts(), actionCloses: false })
        ]) : null,
        document ? set({ key: 'dl' }, [
          item({ label: 'Download BioPAX', action: () => exportDocumentToBiopax(document.id()) }),
          item({ label: 'Download SBGN', action: () => exportDocumentToSbgn(document.id()) }),
          item({ label: 'Download text', action: () => exportDocumentToTxt(document.id()) })
        ]) : null,
        set({ key: 'nav' }, [
          item({ label: 'New factoid', action: () => history.push('/new') }),
          item({ label: 'My factoids', action: () => this.selectMyFactoids(), actionCloses: false })
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
    let { bus, document, history, title, networkEditor } = this.props;

    let editorSwitcher = () => {
      if( document == null ){ return null; }

      let id = document.id();
      let secret = document.secret();
      let description = networkEditor ? 'Form Editor' : 'Network Editor';
      let url = `/${networkEditor ? 'form' : 'document'}/${id}/${secret}`;

      return h(Tooltip, { description, tippy: { placement: 'bottom' } }, [
        h('div.main-menu-switcher', [
          h(Link, { to: url }, [
            h('i.material-icons', 'swap_horiz')
          ])
        ])
      ]);
    };

    return h('div.main-menu', [
      h(Popover, {
        hide: hideNow => emitter.on('close', hideNow),
        tippy: {
          onHide: () => emitter.emit('hide'),
          onShow: () => emitter.emit('show'),
          placement: 'bottom',
          html: h(MenuContent, { bus, document, history, emitter, networkEditor })
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
      ]),

      editorSwitcher(),

      title ? h('h1.main-menu-title', title) : null
    ]);

  }
}

module.exports = MainMenu;