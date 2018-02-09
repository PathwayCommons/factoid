
const React = require('react');
const h = require('react-hyperscript');
const MultiStep = require('react-stepzilla').default;
const { Tab, Tabs, TabList, TabPanel } = require('react-tabs');


const Editor = require('../editor');
const SubmitPage = require('./submit-page');


class MultiFormEditor extends React.Component {
  render() {
    return (
      h('div.multi-form-editor', [
        h('div.editor-context', [
          h('div.site-logo', [
            h('i.icon.icon-logo.home-logo-icon'),
            ' Factoid'
          ])
        ]),
        h('div.editor-content', [
          h(Tabs, [
            h(TabList, { className: 'editor-toolbar' }, [
              h(Tab, [h('div', 'Graph view tab')]),
              h(Tab, [h('div', 'Form view tab')]),
              h(Tab, [h('div', 'Free Text entry view tab')])
            ]),
            h(TabPanel, { className: 'editor-view-panel' }, [
              h(Editor, this.props)
            ]),
            h(TabPanel, [
              h('div.form-view-panel', [
                'form view'
              ])
            ]),
            h(TabPanel,[
              h('div.text-entry-view-panel', [
                'text entry view'
              ])
            ])
          ]),
          h('div.editor-stepper', [
            h('div', 'button previous'),
            h('div', 'edit step 1'),
            h('div', 'edit step 2'),
            h('div', 'edit step 3'),
            h('div', 'button next')
          ])
        ])
      ])
    );
  }
}

module.exports = MultiFormEditor;
