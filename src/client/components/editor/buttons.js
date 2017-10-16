const h = require('react-hyperscript');
const Tooltip = require('../tooltip');
const Toggle = require('../toggle');
const Popover = require('../popover');
const Linkout = require('../document-linkout');

module.exports = function({ controller, document }){
  let btns = [];

  if( document.editable() ){
    btns.push(
      h(Tooltip, { description: 'Add entity', shortcut: 'e' }, [
        h('button.editor-button.plain-button', { onClick: () => controller.addElement() }, [
          h('i.material-icons', 'add_circle')
        ])
      ])
    );

    if( controller.allowDisconnectedInteractions() ){
      btns.push(
        h(Tooltip, { description: 'Add interaction', shortcut: 'i' }, [
          h('button.editor-button.plain-button', { onClick: () => controller.addInteraction() }, [
            h('i.material-icons', 'add_box')
          ])
        ])
      );
    }

    btns.push(
      h(Tooltip, { description: 'Delete selected', shortcut: 'del' }, [
        h('button.editor-button.plain-button', { onClick: () => controller.removeSelected() }, [
          h('i.material-icons', 'clear')
        ])
      ]),
      h(Tooltip, { description: 'Toggle draw connections mode', shortcut: 'd' }, [
        h(Toggle, { className: 'editor-button plain-button', onToggle: () => controller.toggleDrawMode(), getState: () => controller.drawMode() }, [
          h('i.material-icons', 'keyboard_tab')
        ])
      ]),
      h(Tooltip, { description: 'Re-arrange all entities', shortcut: 'r' }, [
        h('button.editor-button.plain-button', { onClick: () => controller.layout() }, [
          h('i.material-icons', 'shuffle')
        ])
      ])
    );
  }

  btns.push(
    h(Tooltip, { description: 'Fit to screen', shortcut: 'f' }, [
      h('button.editor-button.plain-button', { onClick: () => controller.fit() }, [
        h('i.material-icons', 'zoom_out_map')
      ])
    ]),

    h(Popover, {
      tippy: {
        position: 'right',
        html: h('div.editor-linkout', [
          h(Linkout, { document })
        ])
      }
    }, [
      h(Tooltip, { description: 'Share link' }, [
        h('button.editor-button.plain-button', [
          h('i.material-icons', 'link')
        ])
      ])
    ])
  );

  return h('div.editor-buttons', btns);
};
