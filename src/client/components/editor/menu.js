const h = require('react-hyperscript');
const Popover = require('../popover');
const Tooltip = require('../tooltip');
const { Tab, Tabs, TabList, TabPanel } = require('react-tabs');
const Help = require('./help');
const Linkout = require('../document-linkout');

module.exports = function({ document }){
  return h('div.editor-menu', [
    h(Popover, {
      tippy: {
        html: h('div.editor-menu-content', [
          h(Tabs, [
            h(TabList, [
              h(Tab, [
                h(Tooltip, { description: 'Help & about', tippy: { position: 'bottom' } }, [
                  h('span.editor-menu-tab-title', [ h('i.material-icons', 'help') ])
                ])
              ]),
              h(Tab, [
                h(Tooltip, { description: 'Share link', tippy: { position: 'bottom' } }, [
                  h('span.editor-menu-tab-title', [ h('i.material-icons', 'link') ])
                ])
              ])
            ]),

            h(TabPanel, [
              h('div.editor-menu-tab-content', [
                h(Help)
              ])
            ]),

            h(TabPanel, [
              h('div.editor-menu-tab-content', [
                h(Linkout, { document })
              ])
            ])
          ])
        ])
      }
    }, [
      h(Tooltip, { description: 'Open the main menu' }, [
        h('button.editor-button.plain-button', [
          h('i.material-icons', 'menu')
        ])
      ])
    ])
  ]);
};
