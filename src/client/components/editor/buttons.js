const React = require('react');
const h = require('react-hyperscript');
const _ = require('lodash');
const { tippyTopZIndex } = require('../../defs');
const Tooltip = require('../popover/tooltip');
const Toggle = require('../toggle');
const AppNav = require('../app-nav');
const Popover = require('../popover/popover');
const Linkout = require('../document-linkout');
const { exportDocumentToOwl } = require('../../util');

const { TaskListButton } = require('./task-list');


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
            h('i.material-icons', 'add_circle')
          ])
        ]),

        h(Tooltip, _.assign({}, baseTooltipProps, { description: 'Draw an interaction', shortcut: 'd' }), [
          h(Toggle, { className: 'editor-button plain-button', onToggle: () => controller.toggleDrawMode(), getState: () => controller.drawMode()  }, [
            h('i.material-icons', 'arrow_forward')
          ])
        ]),

        h(Tooltip, _.assign({}, baseTooltipProps, {  description: 'Delete selected', shortcut: 'del' }), [
          h('button.editor-button.plain-button', { onClick: () => controller.removeSelected()  }, [
            h('i.material-icons', 'clear')
          ])
        ])

      ]);
    }

    grs.push([
      h(Tooltip, _.assign({}, baseTooltipProps, {  description: 'Fit to screen', shortcut: 'f' }), [
        h('button.editor-button.plain-button', { onClick: () => controller.fit()  }, [
          h('i.material-icons', 'zoom_out_map')
        ])
      ]),
    ]);

    return h(`div.${className}`, grs.map( btns => h('div.editor-button-group', btns) ));
  }
}

class AppButtons extends React.Component {
  render(){
    let { bus, className, document, controller, history } = this.props;
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

    let appButtons = [
      h(Tooltip, _.assign({}, baseTooltipProps, { description: 'Factoid home' }), [
        h('button.editor-button.plain-button', { onClick: () => history.push('/') }, [
          h('i.app-icon')
        ])
      ]),
      h(Tooltip, { description: 'Help' }, [
        h('button.editor-button.plain-button', { onClick: _.debounce(() => bus.emit('togglehelp'), 300) }, [
          h('i.material-icons', 'info')
        ])
      ])
    ];

    if( document.editable() ){
      appButtons.push([
        h(Tooltip, _.assign({}, baseTooltipProps,  { description: 'Tasks' }), [
          h(Toggle, {
            className: 'editor-button plain-button task-list-button',
            controller,
            document,
            bus,
            onToggle: () => controller.toggleTaskListMode(),
            getState: () => controller.taskListMode()
          }, [
            h(TaskListButton, { controller, document, bus })
          ])
        ])
      ]);
    }

    grs.push(appButtons);
    appButtons.push([
      h(Popover, {
        tippy: {
          position: 'right',
          html: h('div.editor-linkout', [
            h(Linkout, { document })
          ])
        }
      }, [
        h(Tooltip, _.assign({}, baseTooltipProps, { description: 'Share link' }), [
          h('button.editor-button.plain-button', [
            h('i.material-icons', 'link')
          ])
        ])
      ]),

      h(Tooltip, _.assign( {}, baseTooltipProps, { description: 'Save as BioPAX' }), [
        h('button.editor-button.plain-button', { onClick: () => exportDocumentToOwl(document.id()) }, [
          h('i.material-icons', 'save_alt')
        ])
      ])
    ]);

    if( document.editable() ){
      appButtons.push([
        h(Popover, {
          tippy: {
            position: 'right',
            html: h(AppNav, { document, history, networkEditor: true })
          }
        }, [
          h(Tooltip, _.assign({}, baseTooltipProps, { description: 'Menu' }), [
            h('button.editor-button.plain-button', [
              h('i.material-icons', 'more_vert')
            ])
          ])
        ])
      ]);
    }


    return h(`div.${className}`, grs.map( btns => h('div.editor-button-group', btns) ));

  }

}

module.exports = { AppButtons, EditorButtons };
