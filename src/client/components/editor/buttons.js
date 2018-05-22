const h = require('react-hyperscript');
const Tooltip = require('../popover/tooltip');
const Toggle = require('../toggle');
const Popover = require('../popover/popover');
const Linkout = require('../document-linkout');
const { exportDocumentToOwl } = require('../../../util');

module.exports = function({ controller, document, bus }){
  let grs = [];

  if( document.editable() ){
    grs.push([
      h(Tooltip, { description: 'Add entity', shortcut: 'e' }, [
        h('button.editor-button.plain-button', { onClick: () => controller.addElement().then( el => bus.emit('opentip', el) ) }, [
          h('i.material-icons', 'add_circle')
        ])
      ]),

      h(Tooltip, { description: 'Draw an interaction', shortcut: 'd' }, [
        h(Toggle, { className: 'editor-button plain-button', onToggle: () => controller.toggleDrawMode(), getState: () => controller.drawMode() }, [
          h('i.material-icons', 'arrow_forward')
        ])
      ]),

      h(Tooltip, { description: 'Delete selected', shortcut: 'del' }, [
        h('button.editor-button.plain-button', { onClick: () => controller.removeSelected() }, [
          h('i.material-icons', 'clear')
        ])
      ])

    ]);
  }

  grs.push([
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
    ]),

    h(Tooltip, { description: 'Export to Biopax' }, [
      h('button.editor-button.plain-button', { onClick: () => exportDocumentToOwl(document) }, [
        h('i.material-icons', 'save_alt')
      ])
    ])
  ]);

  return h('div.editor-buttons', grs.map( btns => h('div.editor-button-group', btns) ));
};
