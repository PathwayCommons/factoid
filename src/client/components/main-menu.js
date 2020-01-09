import { Component } from 'react';
import h from 'react-hyperscript';
import Popover from './popover/popover';
import EventEmitter from 'eventemitter3';
import Tooltip from './popover/tooltip';

class MenuContent extends Component {
  constructor(props){
    super(props);

    this.state = {
      selectedLinkouts: false,
      selectedMyFactoids: false
    };

    this.props.emitter.on('hide', this.onHide);
  }

  componentWillUnmount(){

  }

  selectLinkouts(){
  }

  selectMyFactoids(){
  }

  render(){
    const { bus, document, history, emitter, admin } = this.props;

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

    let content = h('div.main-menu-list', [
      set({ key: 'nav' }, [
        item({ label: 'Home', action: () => history.push('/') })
      ].concat( admin ? [
        item({ label: 'Document management panel', action: () => history.push('/document') }),
        item({ label: 'Add a new document', action: () => history.push('/document/new') })
      ] : null )),
      document ? set({ key: 'util' }, [
        item({ label: 'Help', action: () => bus.emit('togglehelp') }),
      ]) : null
    ]);

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
    let { bus, document, history, admin } = this.props;

    if( document.editable() ){
      return h('div.main-menu', [
        h(Popover, {
          hide: hideNow => emitter.on('close', hideNow),
          tippy: {
            onHide: () => emitter.emit('hide'),
            onShow: () => emitter.emit('show'),
            placement: 'bottom',
            html: h(MenuContent, { bus, document, history, emitter, admin })
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
    } else {
      return h('div.main-menu', [
        h('div.main-menu-logo', {
          onClick: () => history.push('/')
        }, [
          h('i.icon.icon-logo')
        ])
      ]);
    }

  }
}

export default MainMenu;
