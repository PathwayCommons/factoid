
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
            h(TabPanel, [
              h(Editor, this.props)
            ])
          ]),

            // h('div.editor-view-panel', { className: 'multi-form-editor-graph' }, [
            //   h(Editor, this.props),
            // ])
          ])
      //     h('div.editor-view', [
      //       h(Tabs, [
      //         // h('div.editor-toolbar', [
      //           h(TabList, [
      //             h(Tab, [h('div', 'Graph view tab')]),
      //             h(Tab, [h('div', 'Form view tab')]),
      //             h(Tab, [h('div', 'Free Text entry view tab')])
      //           ]),
      //         // ]),
      //       h(TabPanel, [
      //         h('div.editor-view-panel', { className: 'multi-form-editor-graph' }, [
      //           h(Editor, this.props),
      //         ])
      //       ]),
      //       h(TabPanel, 'form view panel'),
      //       h(TabPanel, 'free text entry panel')
      //     ]),
      //     h('div.editor-stepper', [
      //       h('div', 'button previous'),
      //       h('div', 'edit step 1'),
      //       h('div', 'edit step 2'),
      //       h('div', 'edit step 3'),
      //       h('div', 'button next')
      //     ])
      //   ])
      // ])
        // ])
      ])
    );
  }
}

module.exports = MultiFormEditor;
