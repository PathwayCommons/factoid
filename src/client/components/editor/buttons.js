const React = require('react');
const h = require('react-hyperscript');
const _ = require('lodash');
const { tippyTopZIndex } = require('../../defs');
const Tooltip = require('../popover/tooltip');
const Toggle = require('../toggle');

class EditorButtons extends React.Component {
  render(){
    let { bus, className, document, controller } = this.props;
    let grs = [];

    let baseTooltipProps = {
      show: showNow => {
        bus.on('showtips', showNow);
      },
      hide: hideNow => {
        bus.on('hidetips', hideNow);
      },
      tippy: {
        zIndex: tippyTopZIndex,
        hideOnClick: false,
        events: 'mouseenter manual'
      }
    };

    if( document.editable() ){
      grs.push([
        h(Tooltip, _.assign({}, baseTooltipProps, { description: 'Add an entity', shortcut: 'e' }), [
          h('button.editor-button.plain-button', { onClick: () => controller.addElement().then( el => bus.emit('opentip', el) )  }, [
            h('i.material-icons', 'fiber_manual_record')
          ])
        ]),

        h(Tooltip, _.assign({}, baseTooltipProps, { description: 'Draw an interaction', shortcut: 'd' }), [
          h(Toggle, { className: 'editor-button plain-button', onToggle: () => controller.toggleDrawMode(), getState: () => controller.drawMode()  }, [
            h('i.material-icons.icon-rot-45', 'remove')
          ])
        ])
      ]);
    }

    return h(`div.${className}`, grs.map( btns => h('div.editor-button-group', btns) ));
  }
}

module.exports = EditorButtons;
