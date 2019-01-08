const React = require('react');
const h = require('react-hyperscript');
const _ = require('lodash');
const { tippyTopZIndex } = require('../../defs');
const Tooltip = require('../popover/tooltip');
const Toggle = require('../toggle');
const { PARTICIPANT_TYPE } = require('../../../model/element/participant-type');

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
      const PptTypeBtn = (type, description, shortcut) => (
        h(Tooltip, _.assign({}, baseTooltipProps, { description, shortcut }), [
          h(Toggle, {
            className: 'editor-button plain-button',
            onToggle: () => controller.toggleDrawMode(null, type),
            getState: () => controller.drawMode() && controller.drawModeType().value === type.value
          }, [
            h('i', {
              className: type.icon + ' icon-rot-345'
            })
          ])
        ])
      );

      grs.push([
        h(Tooltip, _.assign({}, baseTooltipProps, { description: 'Add an entity', shortcut: '1' }), [
          h('button.editor-button.plain-button', { onClick: () => controller.addElement().then( el => bus.emit('opentip', el) )  }, [
            h('i.material-icons', 'fiber_manual_record')
          ])
        ]),

        PptTypeBtn(PARTICIPANT_TYPE.UNSIGNED, 'Draw an undirected interaction', '2'),
        PptTypeBtn(PARTICIPANT_TYPE.POSITIVE, 'Draw an activation interaction', '3'),
        PptTypeBtn(PARTICIPANT_TYPE.NEGATIVE, 'Draw an inhibition interaction', '4')
      ]);
    }

    return h(`div.${className}`, grs.map( btns => h('div.editor-button-group', btns) ));
  }
}

module.exports = EditorButtons;
