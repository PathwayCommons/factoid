const DirtyComponent = require('../dirty-component');
const h = require('react-hyperscript');
const _ = require('lodash');
const { tippyTopZIndex } = require('../../defs');
const Tooltip = require('../popover/tooltip');
const Toggle = require('../toggle');
const Popover = require('../popover/popover');
const Linkout = require('../document-linkout');

class TaskListButton extends DirtyComponent {
  constructor(props){
    super(props);
  }

  shouldComponentUpdate() {
    return true;
  }

  componentDidMount(){
    this.onAdd = () => this.dirty();
    this.onRemove = () => this.dirty();
    this.props.document.on('add', this.onAdd);
    this.props.document.on('remove', this.onRemove);
  }

  componentWillUnmount(){
    this.props.document.removeListener(this.onAdd);
    this.props.document.removeListener(this.onRemove);
  }

  render() {
    let numIncompleteEntities = this.props.document.entities().filter(ent => !ent.completed()).length;
    return h('button.editor-button.plain-button', { onClick: () => this.props.bus.emit('toggletasklist') }, [
      numIncompleteEntities !== 0 ? h('div.num-tasks', this.props.document.entities().filter(ent => !ent.completed()).length) : null,
      h('i.material-icons', 'format_list_bulleted')
    ]);
  }
}

module.exports = function({ controller, document, bus }){
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

  grs.push([
    h(Tooltip, { description: 'Help' }, [
      h('button.editor-button.plain-button', { onClick: () => bus.emit('togglehelp') }, [
        h('i.material-icons', 'info')
      ])
    ])
  ]);

  if( document.editable() ){
    grs.push([
      h(Tooltip, _.assign({}, baseTooltipProps,  { description: 'Tasks' }), [
        h(TaskListButton, { controller, document, bus })
      ])
    ]);

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
    ])
  ]);

  return h('div.editor-buttons', grs.map( btns => h('div.editor-button-group', btns) ));
};
