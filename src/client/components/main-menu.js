import { Component } from 'react';
import h from 'react-hyperscript';
import Popover from './popover/popover';
import Linkout from './document-linkout';
import EventEmitter from 'eventemitter3';
import Tooltip from './popover/tooltip';

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
    const { bus, document, history, emitter } = this.props;
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
      content = h('div.main-menu-my-factoids', 'Nope');
    } else {
      content = h('div.main-menu-list', [
        set({ key: 'nav' }, [
          item({ label: 'Home', action: () => history.push('/') })
        ]),
        document ? set({ key: 'util' }, [
          item({ label: 'Help', action: () => bus.emit('togglehelp') }),
        ]) : null
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
    let { bus, document, history, networkEditor } = this.props;

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
          h('div.main-menu-logo', [
            h('i.icon.icon-logo'),
            h('i.material-icons.icon-logo-beside', 'keyboard_arrow_down')
          ])
        ])
      ])
    ]);

  }
}

export default MainMenu;
