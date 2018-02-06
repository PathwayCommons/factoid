const React = require('react');
const h = require('react-hyperscript');
const { Tab, Tabs, TabList, TabPanel } = require('react-tabs');

class Editor extends React.Component {
  render() {
    return h('div.multi-form-editor', [
      h('div.editor-content', [
        h(Tabs, [
          h(TabList, [
            h(Tab, ['Graph View Tab']),
            h(Tab, ['Form View Tab']),
            h(Tab, ['Free Text View Tab'])
          ]),
          h(TabPanel, 'Graph View'),
          h(TabPanel, 'Form View'),
          h(TabPanel, 'Free Text View')
        ])
      ]),
      h('div.context-side-bar', [
        'This should show you what to do in the editor'
      ])
    ]);
  }
}

module.exports = Editor;